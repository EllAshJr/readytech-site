"use strict";

const crypto = require("crypto");
const express = require("express");
const rateLimitPackage = require("express-rate-limit");

const { query } = require("../db/pool");
const { cards, cardById, acquisition, quickReference } = require("../data/sales-playbook");
const {
  normalizeCardAnswers,
  getWorkflowSequence,
  getNextCardId,
  getPreviousCardId,
  analyzeSalesConsultation,
} = require("../services/sales-recommendation-engine");
const {
  authenticate,
  attachSession,
  requireSalesAuth,
  requireCsrf,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  defaultHintAvailable,
} = require("../services/sales-auth");
const { sendSalesConsultationReport } = require("../services/sales-email-service");

const router = express.Router();
const rateLimit = rateLimitPackage.rateLimit || rateLimitPackage;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Wait 15 minutes and try again.",
  standardHeaders: true,
  legacyHeaders: false,
});

const actionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 120,
  message: "Too many sales-app actions. Wait briefly and try again.",
  standardHeaders: true,
  legacyHeaders: false,
});

router.use((req, res, next) => {
  res.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.set("Cache-Control", "no-store, private");
  res.set("Referrer-Policy", "same-origin");
  next();
});

router.use(attachSession);

function baseViewData(extra = {}) {
  return {
    pageTitle: "ReadyTech Sales Coach",
    cards,
    acquisition,
    quickReference,
    ...extra,
  };
}

function safeReturnTo(value) {
  const candidate = String(value || "");
  return candidate.startsWith("/sales") && !candidate.startsWith("//")
    ? candidate
    : "/sales";
}

function consultationNumber() {
  const year = new Date().getFullYear();
  return `RT-S-${year}-${crypto.randomInt(100000, 1000000)}`;
}

async function getConsultation(id) {
  const result = await query(
    `SELECT * FROM sales_consultations WHERE id = $1 LIMIT 1`,
    [Number(id)],
  );
  return result.rows[0] || null;
}

async function createConsultation(session) {
  let lastError;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const result = await query(
        `
          INSERT INTO sales_consultations (
            consultation_number,
            salesperson_name,
            salesperson_email,
            status,
            current_card,
            answers
          )
          VALUES ($1, $2, $3, 'in_progress', 1, '{}'::jsonb)
          RETURNING *
        `,
        [consultationNumber(), session.name, session.email.toLowerCase()],
      );
      return result.rows[0];
    } catch (error) {
      lastError = error;
      if (error.code !== "23505") throw error;
    }
  }

  throw lastError || new Error("Could not create a unique sales consultation number.");
}

async function updateConsultation(id, answers, currentCard, status = "in_progress", analysis = null) {
  const result = await query(
    `
      UPDATE sales_consultations
      SET
        customer_name = NULLIF($2, ''),
        business_name = NULLIF($3, ''),
        customer_email = NULLIF($4, ''),
        customer_phone = NULLIF($5, ''),
        business_type = NULLIF($6, ''),
        city = NULLIF($7, ''),
        status = $8::text,
        current_card = $9,
        answers = $10::jsonb,
        analysis = $11::jsonb,
        updated_at = NOW(),
        completed_at = CASE WHEN $8::text = 'completed' THEN COALESCE(completed_at, NOW()) ELSE completed_at END
      WHERE id = $1
      RETURNING *
    `,
    [
      Number(id),
      answers.customer_name || "",
      answers.business_name || "",
      answers.customer_email || "",
      answers.customer_phone || "",
      answers.business_type || "",
      answers.city || "",
      status,
      Number(currentCard) || 1,
      JSON.stringify(answers),
      analysis ? JSON.stringify(analysis) : null,
    ],
  );

  return result.rows[0] || null;
}

function visitedWith(currentVisited, currentCardId) {
  const visited = Array.isArray(currentVisited)
    ? currentVisited.map(Number).filter(Number.isFinite)
    : [];
  const current = Number(currentCardId);
  if (!visited.includes(current)) visited.push(current);
  return visited;
}

function handleRouteError(res, error, message) {
  console.error(error);
  const setupError = /DATABASE_URL|sales_consultations|RESEND_API_KEY|SALES_/.test(
    error.message || "",
  );
  return res.status(setupError ? 503 : 500).render(
    "sales/error",
    baseViewData({
      message: setupError
        ? "The sales application is still being configured. Check the database migration and Render environment variables."
        : message,
      details: process.env.NODE_ENV === "production" ? "" : error.message,
    }),
  );
}

router.get("/sales/login", (req, res) => {
  if (req.salesSession) return res.redirect("/sales");
  return res.render(
    "sales/login",
    baseViewData({
      error: "",
      returnTo: safeReturnTo(req.query.returnTo),
      showDefaultHint: defaultHintAvailable(),
    }),
  );
});

router.post("/sales/login", loginLimiter, (req, res) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const name = String(req.body.salesperson_name || "").trim();
    const email = String(req.body.salesperson_email || "").trim().toLowerCase();

    if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).render(
        "sales/login",
        baseViewData({
          error: "Enter your name and a valid work email.",
          returnTo: safeReturnTo(req.body.returnTo),
          showDefaultHint: defaultHintAvailable(),
        }),
      );
    }

    if (!authenticate(username, password)) {
      return res.status(401).render(
        "sales/login",
        baseViewData({
          error: "The username or password is incorrect.",
          returnTo: safeReturnTo(req.body.returnTo),
          showDefaultHint: defaultHintAvailable(),
        }),
      );
    }

    const token = createSessionToken({ name, email, username });
    setSessionCookie(res, token);
    return res.redirect(safeReturnTo(req.body.returnTo));
  } catch (error) {
    return handleRouteError(res, error, "The sales login could not be completed.");
  }
});

router.post("/sales/logout", requireSalesAuth, requireCsrf, (req, res) => {
  clearSessionCookie(res);
  return res.redirect("/sales/login");
});

router.get("/sales", requireSalesAuth, async (req, res) => {
  try {
    const result = await query(
      `
        SELECT *
        FROM sales_consultations
        ORDER BY updated_at DESC
        LIMIT 50
      `,
    );

    return res.render(
      "sales/dashboard",
      baseViewData({
        consultations: result.rows,
      }),
    );
  } catch (error) {
    return handleRouteError(res, error, "The sales dashboard could not be loaded.");
  }
});

router.get("/sales/reference", requireSalesAuth, (req, res) => {
  return res.render(
    "sales/reference",
    baseViewData({}),
  );
});

router.post(
  "/sales/consultations",
  actionLimiter,
  requireSalesAuth,
  requireCsrf,
  async (req, res) => {
    try {
      const consultation = await createConsultation(req.salesSession);
      return res.redirect(`/sales/consultations/${consultation.id}/card/1`);
    } catch (error) {
      return handleRouteError(res, error, "A new consultation could not be started.");
    }
  },
);

router.get(
  "/sales/consultations/:id/card/:cardId",
  requireSalesAuth,
  async (req, res) => {
    try {
      const consultation = await getConsultation(req.params.id);
      if (!consultation) return res.status(404).render("sales/error", baseViewData({ message: "Consultation not found.", details: "" }));

      const cardId = Number(req.params.cardId);
      const card = cardById.get(cardId);
      if (!card) return res.redirect(`/sales/consultations/${consultation.id}/card/${consultation.current_card || 1}`);

      const answers = consultation.answers || {};
      const analysis = analyzeSalesConsultation(answers);
      const sequence = getWorkflowSequence(answers);

      return res.render(
        "sales/wizard",
        baseViewData({
          consultation,
          card,
          answers,
          analysis,
          sequence,
          previousCardId: getPreviousCardId(cardId, answers),
          nextCardId: getNextCardId(cardId, answers),
        }),
      );
    } catch (error) {
      return handleRouteError(res, error, "The consultation card could not be loaded.");
    }
  },
);

router.post(
  "/sales/consultations/:id/card/:cardId",
  actionLimiter,
  requireSalesAuth,
  requireCsrf,
  async (req, res) => {
    try {
      const consultation = await getConsultation(req.params.id);
      if (!consultation) return res.status(404).send("Consultation not found.");

      const cardId = Number(req.params.cardId);
      const card = cardById.get(cardId);
      if (!card) return res.status(400).send("Unknown sales card.");

      const cardAnswers = normalizeCardAnswers(cardId, req.body);
      const answers = {
        ...(consultation.answers || {}),
        ...cardAnswers,
      };
      answers.__visitedCards = visitedWith(
        consultation.answers && consultation.answers.__visitedCards,
        cardId,
      );

      const action = req.body.action || "next";

      if (action === "save") {
        await updateConsultation(consultation.id, answers, cardId, "in_progress");
        return res.redirect("/sales");
      }

      if (action === "back") {
        const previous = getPreviousCardId(cardId, answers) || 1;
        await updateConsultation(consultation.id, answers, previous, "in_progress");
        return res.redirect(`/sales/consultations/${consultation.id}/card/${previous}`);
      }

      if (action === "complete" || cardId === 12) {
        const analysis = analyzeSalesConsultation(answers);
        const completed = await updateConsultation(
          consultation.id,
          answers,
          12,
          "completed",
          analysis,
        );

        let emailStatus = "sent";
        try {
          const emailResult = await sendSalesConsultationReport({
            consultation: completed,
            analysis,
            recipient: completed.salesperson_email,
          });
          emailStatus = emailResult.skipped ? "skipped" : "sent";
          if (emailResult.id) {
            await query(
              `UPDATE sales_consultations SET report_email_id = $2, report_emailed_at = NOW(), updated_at = NOW() WHERE id = $1`,
              [completed.id, emailResult.id],
            );
          }
        } catch (emailError) {
          console.error("Sales report email failed:", emailError);
          emailStatus = "failed";
        }

        return res.redirect(
          `/sales/consultations/${completed.id}/results?email=${emailStatus}`,
        );
      }

      const next = getNextCardId(cardId, answers) || 12;
      await updateConsultation(consultation.id, answers, next, "in_progress");
      return res.redirect(`/sales/consultations/${consultation.id}/card/${next}`);
    } catch (error) {
      return handleRouteError(res, error, "The consultation answers could not be saved.");
    }
  },
);

router.get(
  "/sales/consultations/:id/results",
  requireSalesAuth,
  async (req, res) => {
    try {
      const consultation = await getConsultation(req.params.id);
      if (!consultation) return res.status(404).render("sales/error", baseViewData({ message: "Consultation not found.", details: "" }));
      const analysis = consultation.analysis || analyzeSalesConsultation(consultation.answers || {});

      return res.render(
        "sales/results",
        baseViewData({
          consultation,
          analysis,
          emailStatus: req.query.email || "",
        }),
      );
    } catch (error) {
      return handleRouteError(res, error, "The sales plan could not be loaded.");
    }
  },
);

router.post(
  "/sales/consultations/:id/email",
  actionLimiter,
  requireSalesAuth,
  requireCsrf,
  async (req, res) => {
    try {
      const consultation = await getConsultation(req.params.id);
      if (!consultation) return res.status(404).send("Consultation not found.");
      const analysis = consultation.analysis || analyzeSalesConsultation(consultation.answers || {});
      const result = await sendSalesConsultationReport({
        consultation,
        analysis,
        recipient: consultation.salesperson_email,
      });

      if (result.id) {
        await query(
          `UPDATE sales_consultations SET report_email_id = $2, report_emailed_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [consultation.id, result.id],
        );
      }

      return res.redirect(
        `/sales/consultations/${consultation.id}/results?email=${result.skipped ? "skipped" : "sent"}`,
      );
    } catch (error) {
      console.error(error);
      return res.redirect(`/sales/consultations/${req.params.id}/results?email=failed`);
    }
  },
);

module.exports = router;
