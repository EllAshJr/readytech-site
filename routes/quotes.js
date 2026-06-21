"use strict";

const crypto = require("crypto");
const express = require("express");
const rateLimitPackage = require("express-rate-limit");

const { query } = require("../db/pool");
const {
  businessTypes,
  services,
  recommendations,
  rejectionReasons,
  allowedServiceSlugs,
} = require("../data/estimator-rules");
const {
  normalizeInput,
  calculateEstimate,
  formatMoney,
  encodePayload,
  decodePayload,
} = require("../services/estimate-engine");
const {
  sendInitialEstimateEmails,
  sendDecisionEmails,
  sendCallRequestEmails,
} = require("../services/email-service");
const { validateTurnstile } = require("../services/turnstile-service");

const router = express.Router();
const rateLimit = rateLimitPackage.rateLimit || rateLimitPackage;

const calculateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many estimate calculations. Please wait and try again.",
});

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  message: "Too many estimate submissions. Please wait and try again.",
});

const decisionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many estimate responses. Please wait and try again.",
});

router.use((req, res, next) => {
  res.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.set("Cache-Control", "no-store, private");
  res.set("Referrer-Policy", "no-referrer");
  next();
});

function tokenSecret() {
  if (process.env.QUOTE_TOKEN_SECRET) return process.env.QUOTE_TOKEN_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("QUOTE_TOKEN_SECRET is not configured.");
  }
  console.warn("QUOTE_TOKEN_SECRET is not set; using a development-only secret.");
  return "readytech-development-only-secret-change-me";
}

function hashDecisionToken(rawToken) {
  return crypto.createHash("sha256").update(`${rawToken}:${tokenSecret()}`).digest("hex");
}

function createDecisionToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function createQuoteNumber() {
  const year = new Date().getFullYear();
  const random = crypto.randomInt(100000, 1000000);
  return `RT-${year}-${random}`;
}

function viewData(extra = {}) {
  return {
    pageTitle: "Instant Estimate | ReadyTech",
    metaDescription:
      "Get a ReadyTech estimate for managed VPN, private cloud, network monitoring, business Wi-Fi, backup internet, and restaurant technology.",
    businessTypes,
    serviceDefinitions: services,
    recommendations,
    turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || "",
    formatMoney,
    ...extra,
  };
}

async function insertQuote(estimate, decisionTokenHash) {
  let lastError;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const quoteNumber = createQuoteNumber();
    const input = estimate.input;

    try {
      const result = await query(
        `
          INSERT INTO quotes (
            quote_number,
            customer_name,
            customer_email,
            customer_phone,
            business_name,
            business_type,
            city,
            zip_code,
            location_count,
            selected_services,
            answers,
            line_items,
            setup_total,
            monthly_total,
            complexity_level,
            manual_review,
            warnings,
            assumptions,
            status,
            decision_token_hash,
            expires_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9,
            $10::jsonb, $11::jsonb, $12::jsonb,
            $13, $14, $15, $16, $17::jsonb, $18::jsonb,
            'draft', $19, $20
          )
          RETURNING *
        `,
        [
          quoteNumber,
          input.customer_name,
          input.email.toLowerCase(),
          input.phone || null,
          input.business_name,
          input.business_type,
          input.city,
          input.zip_code,
          input.location_count,
          JSON.stringify(input.services),
          JSON.stringify(input),
          JSON.stringify(estimate.lineItems),
          estimate.setupTotal,
          estimate.monthlyTotal,
          estimate.complexityLevel,
          estimate.manualReview,
          JSON.stringify(estimate.warnings),
          JSON.stringify(estimate.assumptions),
          decisionTokenHash,
          estimate.expiresAt,
        ],
      );
      return result.rows[0];
    } catch (error) {
      lastError = error;
      if (error.code !== "23505") throw error;
    }
  }

  throw lastError || new Error("Could not generate a unique estimate number.");
}

async function findQuote(quoteNumber, rawToken) {
  const hash = hashDecisionToken(rawToken);
  const result = await query(
    `SELECT * FROM quotes WHERE quote_number = $1 AND decision_token_hash = $2 LIMIT 1`,
    [quoteNumber, hash],
  );
  return result.rows[0] || null;
}

function isExpired(quote) {
  return new Date(quote.expires_at).getTime() <= Date.now();
}

async function markExpiredIfNeeded(quote) {
  if (!quote || !isExpired(quote)) return quote;
  if (["accepted_pending_verification", "rejected", "converted"].includes(quote.status)) return quote;

  const result = await query(
    `UPDATE quotes SET status = 'expired' WHERE id = $1 RETURNING *`,
    [quote.id],
  );
  return result.rows[0];
}

async function handleRouteError(res, error, fallbackMessage) {
  console.error(error);
  const configurationError = /DATABASE_URL|QUOTE_TOKEN_SECRET|RESEND_API_KEY|OWNER_EMAIL/.test(error.message || "");
  return res.status(configurationError ? 503 : 500).render(
    "quote/intake",
    viewData({
      errors: [configurationError ? "The estimate service is being configured. Please try again shortly." : fallbackMessage],
      values: {},
      selectedService: "",
    }),
  );
}

router.get("/instant-quote", (req, res) => {
  const selectedService = allowedServiceSlugs.has(req.query.service) ? req.query.service : "";
  res.render(
    "quote/intake",
    viewData({
      errors: [],
      values: {},
      selectedService,
    }),
  );
});

router.post("/instant-quote/calculate", calculateLimiter, (req, res) => {
  try {
    const input = normalizeInput(req.body);
    const estimate = calculateEstimate(input);
    const quotePayload = encodePayload(estimate.input);

    return res.render(
      "quote/review",
      viewData({
        estimate,
        quotePayload,
      }),
    );
  } catch (error) {
    const errors = error.validationErrors || ["We could not calculate the estimate. Review the form and try again."];
    return res.status(400).render(
      "quote/intake",
      viewData({
        errors,
        values: req.body,
        selectedService: "",
      }),
    );
  }
});

router.post("/instant-quote/submit", submitLimiter, async (req, res) => {
  try {
    const turnstile = await validateTurnstile(req.body["cf-turnstile-response"], req);
    if (!turnstile.success) {
      const input = normalizeInput(decodePayload(req.body.quotePayload));
      const estimate = calculateEstimate(input);
      return res.status(400).render(
        "quote/review",
        viewData({
          estimate,
          quotePayload: req.body.quotePayload,
          errors: ["Verification failed or expired. Complete the security check and submit again."],
        }),
      );
    }

    const estimate = calculateEstimate(decodePayload(req.body.quotePayload));
    const rawToken = createDecisionToken();
    const quote = await insertQuote(estimate, hashDecisionToken(rawToken));

    let deliveryPending = false;
    try {
      const emailResult = await sendInitialEstimateEmails({ quote, rawToken });
      const update = await query(
        `
          UPDATE quotes
          SET status = 'sent', customer_email_id = $2, owner_email_id = $3
          WHERE id = $1
          RETURNING *
        `,
        [quote.id, emailResult.customerEmailId, emailResult.ownerEmailId],
      );
      Object.assign(quote, update.rows[0]);
    } catch (emailError) {
      deliveryPending = true;
      console.error("Estimate saved but email delivery failed:", emailError);
    }

    return res.redirect(
      `/estimate/${encodeURIComponent(quote.quote_number)}/${encodeURIComponent(rawToken)}${
        deliveryPending ? "?delivery=pending" : ""
      }`,
    );
  } catch (error) {
    return handleRouteError(res, error, "The estimate could not be saved. Please try again.");
  }
});

router.get("/estimate/:quoteNumber/:token", async (req, res) => {
  try {
    let quote = await findQuote(req.params.quoteNumber, req.params.token);
    if (!quote) return res.status(404).send("Estimate not found.");

    quote = await markExpiredIfNeeded(quote);

    if (quote.status === "sent") {
      const update = await query(
        `UPDATE quotes SET status = 'viewed', viewed_at = COALESCE(viewed_at, NOW()) WHERE id = $1 RETURNING *`,
        [quote.id],
      );
      quote = update.rows[0];
    }

    return res.render(
      "quote/estimate",
      viewData({
        quote,
        rawToken: req.params.token,
        rejectionReasons,
        deliveryPending: req.query.delivery === "pending",
      }),
    );
  } catch (error) {
    console.error(error);
    return res.status(500).send("The estimate could not be loaded.");
  }
});

router.post("/estimate/:quoteNumber/:token/accept", decisionLimiter, async (req, res) => {
  try {
    let quote = await findQuote(req.params.quoteNumber, req.params.token);
    if (!quote) return res.status(404).send("Estimate not found.");
    quote = await markExpiredIfNeeded(quote);

    if (quote.status === "accepted_pending_verification") {
      return res.render("quote/accepted", viewData({ quote }));
    }
    if (["rejected", "expired"].includes(quote.status)) {
      return res.status(409).render(
        "quote/estimate",
        viewData({ quote, rawToken: req.params.token, rejectionReasons, errors: ["This estimate can no longer be accepted."] }),
      );
    }

    const result = await query(
      `
        UPDATE quotes
        SET status = 'accepted_pending_verification', decision_at = NOW()
        WHERE id = $1 AND status IN ('draft', 'sent', 'viewed') AND expires_at > NOW()
        RETURNING *
      `,
      [quote.id],
    );

    if (result.rowCount === 0) return res.status(409).send("This estimate can no longer be accepted.");
    quote = result.rows[0];

    sendDecisionEmails({ quote, decision: "accepted" }).catch((error) =>
      console.error("Acceptance email failed:", error),
    );

    return res.render("quote/accepted", viewData({ quote }));
  } catch (error) {
    console.error(error);
    return res.status(500).send("The acceptance could not be recorded.");
  }
});

router.post("/estimate/:quoteNumber/:token/reject", decisionLimiter, async (req, res) => {
  try {
    let quote = await findQuote(req.params.quoteNumber, req.params.token);
    if (!quote) return res.status(404).send("Estimate not found.");
    quote = await markExpiredIfNeeded(quote);

    if (quote.status === "rejected") {
      return res.render("quote/rejected", viewData({ quote }));
    }
    if (["accepted_pending_verification", "expired"].includes(quote.status)) {
      return res.status(409).render(
        "quote/estimate",
        viewData({ quote, rawToken: req.params.token, rejectionReasons, errors: ["This estimate can no longer be declined."] }),
      );
    }

    const reason = rejectionReasons.includes(req.body.rejection_reason)
      ? req.body.rejection_reason
      : "Other";
    const details = String(req.body.rejection_details || "").trim().slice(0, 1000);

    const result = await query(
      `
        UPDATE quotes
        SET status = 'rejected', decision_at = NOW(), rejection_reason = $2, rejection_details = $3
        WHERE id = $1 AND status IN ('draft', 'sent', 'viewed') AND expires_at > NOW()
        RETURNING *
      `,
      [quote.id, reason, details || null],
    );

    if (result.rowCount === 0) return res.status(409).send("This estimate can no longer be declined.");
    quote = result.rows[0];

    sendDecisionEmails({ quote, decision: "rejected", reason, details }).catch((error) =>
      console.error("Rejection email failed:", error),
    );

    return res.render("quote/rejected", viewData({ quote }));
  } catch (error) {
    console.error(error);
    return res.status(500).send("The response could not be recorded.");
  }
});

router.post("/estimate/:quoteNumber/:token/request-call", decisionLimiter, async (req, res) => {
  try {
    let quote = await findQuote(req.params.quoteNumber, req.params.token);
    if (!quote) return res.status(404).send("Estimate not found.");
    quote = await markExpiredIfNeeded(quote);

    if (quote.status === "expired") return res.status(409).send("This estimate has expired.");

    const result = await query(
      `UPDATE quotes SET requested_call_at = COALESCE(requested_call_at, NOW()) WHERE id = $1 RETURNING *`,
      [quote.id],
    );
    quote = result.rows[0];

    sendCallRequestEmails({ quote }).catch((error) => console.error("Call-request email failed:", error));
    return res.render("quote/call-requested", viewData({ quote }));
  } catch (error) {
    console.error(error);
    return res.status(500).send("The call request could not be recorded.");
  }
});

module.exports = router;
