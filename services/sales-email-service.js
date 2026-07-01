"use strict";

const { Resend } = require("resend");

let resend;

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function list(items) {
  if (!items || items.length === 0) return "<p>None recorded.</p>";
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function normalizeEmailList(value) {
  const entries = Array.isArray(value) ? value : String(value || "").split(",");

  return entries
    .flatMap((entry) => String(entry || "").split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function uniqueEmailList(values) {
  const seen = new Set();
  const unique = [];

  for (const email of normalizeEmailList(values)) {
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(email);
  }

  return unique;
}

function getOwnerReportRecipients(env = process.env) {
  return normalizeEmailList(env.SALES_OWNER_COPY_EMAIL || env.OWNER_EMAIL || "");
}

function buildSalesReportRecipients({ recipient, env = process.env, logger = console } = {}) {
  const salespersonRecipients = normalizeEmailList(recipient);
  const ownerRecipients = getOwnerReportRecipients(env);
  const ownerCopyMissing = ownerRecipients.length === 0;
  const missingOwnerMessage =
    "SALES_OWNER_COPY_EMAIL or OWNER_EMAIL must be configured for Sales Coach owner report copies.";

  if (ownerCopyMissing) {
    if (env.NODE_ENV === "production") {
      throw new Error(missingOwnerMessage);
    }

    if (logger && typeof logger.warn === "function") {
      logger.warn(`[SALES EMAIL] ${missingOwnerMessage} Sending salesperson copy only.`);
    }
  }

  const to = uniqueEmailList([...salespersonRecipients, ...ownerRecipients]);
  if (to.length === 0) throw new Error("Sales report recipient is not configured.");

  return {
    to,
    salespersonRecipients,
    ownerRecipients,
    ownerCopyMissing,
  };
}

function shell(title, body) {
  return `
    <!doctype html>
    <html>
      <body style="margin:0;background:#0d1117;color:#e5e7eb;font-family:Arial,Helvetica,sans-serif;line-height:1.55;">
        <div style="max-width:820px;margin:0 auto;padding:32px 18px;">
          <div style="background:#161b22;border:1px solid #30363d;border-radius:14px;padding:28px;">
            <p style="margin:0 0 8px;color:#f6a15f;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">ReadyTech Sales Coach</p>
            <h1 style="margin:0 0 20px;color:#ffffff;font-size:28px;">${escapeHtml(title)}</h1>
            ${body}
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:18px;">ReadyTech · readytechinstalls.com</p>
        </div>
      </body>
    </html>
  `;
}

function metric(label, value) {
  return `
    <td style="width:25%;padding:12px;border:1px solid #30363d;vertical-align:top;">
      <div style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:.06em;">${escapeHtml(label)}</div>
      <div style="color:#ffffff;font-size:18px;font-weight:700;margin-top:4px;">${escapeHtml(value)}</div>
    </td>
  `;
}

function baseUrl() {
  return String(process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function displayValue(value) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Not provided";
  if (value === undefined || value === null || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function tableRow(label, value) {
  return `
    <tr>
      <th style="width:32%;padding:8px 10px;border:1px solid #d1d5db;text-align:left;background:#f3f4f6;">${escapeHtml(label)}</th>
      <td style="padding:8px 10px;border:1px solid #d1d5db;">${escapeHtml(displayValue(value))}</td>
    </tr>
  `;
}

function humanizeKey(key) {
  return String(key || "")
    .replace(/^_+/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isSensitiveAnswerKey(key) {
  return /password|token|secret|api[_-]?key|cookie|csrf|database_url/i.test(String(key || ""));
}

function answerRows(answers = {}) {
  return Object.entries(answers)
    .filter(([key, value]) => !String(key).startsWith("__") && !isSensitiveAnswerKey(key) && displayValue(value) !== "Not provided")
    .map(([key, value]) => tableRow(humanizeKey(key), value))
    .join("");
}

function reportSection(title, content) {
  return `
    <section style="margin:26px 0;">
      <h2 style="margin:0 0 10px;color:#111827;font-size:20px;">${escapeHtml(title)}</h2>
      ${content}
    </section>
  `;
}

function reportTable(rows) {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;">${rows.join("")}</table>`;
}

function safeFilenamePart(value) {
  return String(value || "sales-report")
    .trim()
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || "sales-report";
}

function buildSalesReportHtml({ consultation, analysis }) {
  const answers = consultation.answers || {};
  const completedAt = consultation.completed_at || consultation.updated_at || analysis.generatedAt;
  const recommendationReasons = analysis.primaryRecommendation.reasons || [];
  const rawAnswerRows = answerRows(answers);

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>ReadyTech Sales Coach Report ${escapeHtml(consultation.consultation_number)}</title>
      </head>
      <body style="margin:0;background:#f9fafb;color:#111827;font-family:Arial,Helvetica,sans-serif;line-height:1.55;">
        <main style="max-width:920px;margin:0 auto;padding:34px 22px;background:#ffffff;">
          <header style="border-bottom:4px solid #e58336;padding-bottom:18px;margin-bottom:24px;">
            <p style="margin:0 0 6px;color:#e58336;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">ReadyTech Sales Coach</p>
            <h1 style="margin:0;color:#111827;font-size:30px;">Completed Sales Coach Report</h1>
            <p style="margin:8px 0 0;font-size:18px;"><strong>Consultation:</strong> ${escapeHtml(consultation.consultation_number)}</p>
          </header>

          ${reportSection("Salesperson", reportTable([
            tableRow("Name", consultation.salesperson_name),
            tableRow("Email", consultation.salesperson_email),
          ]))}

          ${reportSection("Customer", reportTable([
            tableRow("Customer name", consultation.customer_name),
            tableRow("Business name", consultation.business_name),
            tableRow("Customer email", consultation.customer_email),
            tableRow("Customer phone", consultation.customer_phone),
            tableRow("Business type", consultation.business_type),
            tableRow("City / service area", consultation.city),
            tableRow("Completed", formatDate(completedAt)),
          ]))}

          ${reportSection("Business Situation", reportTable([
            tableRow("Primary problem", answers.primary_problem),
            tableRow("Problem description", answers.problem_description),
            tableRow("Business impact", answers.business_impact),
            tableRow("Problem frequency", answers.problem_frequency),
            tableRow("Downtime tolerance", answers.downtime_tolerance),
            tableRow("Estimated hourly loss", answers.estimated_hourly_loss),
            tableRow("Current support", answers.current_support),
            tableRow("Urgency", answers.urgency),
            tableRow("Budget range", answers.budget_range),
          ]))}

          ${reportSection("Recommendation", `
            ${reportTable([
              tableRow("Primary offer", analysis.primaryRecommendation.title),
              tableRow("Primary price", analysis.primaryRecommendation.price),
              tableRow("Entry offer", analysis.entryOffer.title),
              tableRow("Entry price", analysis.entryOffer.price),
              tableRow("Lead fit", `${analysis.leadFit} (${analysis.leadScore}/5)`),
              tableRow("Business impact", `${analysis.impactLevel} (${analysis.impactScore}/100)`),
              tableRow("Monitored devices", analysis.monitoredDevices),
              tableRow("Territory", analysis.territory && analysis.territory.label),
            ])}
            <h3 style="margin:18px 0 8px;">Reason for recommendation</h3>
            ${list(recommendationReasons)}
            <h3 style="margin:18px 0 8px;">Talk track</h3>
            <p>${escapeHtml(analysis.primaryRecommendation.talkTrack)}</p>
          `)}

          ${reportSection("Good / Better / Best Direction", `
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead>
                <tr>
                  <th style="padding:8px 10px;border:1px solid #d1d5db;text-align:left;background:#f3f4f6;">Option</th>
                  <th style="padding:8px 10px;border:1px solid #d1d5db;text-align:left;background:#f3f4f6;">Purpose</th>
                  <th style="padding:8px 10px;border:1px solid #d1d5db;text-align:left;background:#f3f4f6;">Recommendation</th>
                  <th style="padding:8px 10px;border:1px solid #d1d5db;text-align:left;background:#f3f4f6;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${(analysis.goodBetterBest || []).map((option) => `
                  <tr>
                    <td style="padding:8px 10px;border:1px solid #d1d5db;">${escapeHtml(option.name)}</td>
                    <td style="padding:8px 10px;border:1px solid #d1d5db;">${escapeHtml(option.purpose)}</td>
                    <td style="padding:8px 10px;border:1px solid #d1d5db;">${escapeHtml(option.recommendation)}</td>
                    <td style="padding:8px 10px;border:1px solid #d1d5db;">${escapeHtml(option.price)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          `)}

          ${reportSection("Survey And Engineering Flags", `
            ${reportTable([
              tableRow("Site survey required", analysis.surveyRequired ? "Yes" : "No"),
              tableRow("Engineering review required", analysis.engineeringRequired ? "Yes" : "No"),
            ])}
            <h3 style="margin:18px 0 8px;">Survey reasons</h3>
            ${list(analysis.surveyReasons)}
            <h3 style="margin:18px 0 8px;">Engineering reasons</h3>
            ${list(analysis.engineeringReasons)}
          `)}

          ${reportSection("Next Steps", `
            <p><strong>${escapeHtml(analysis.nextStep.title)}</strong></p>
            <p>${escapeHtml(analysis.nextStep.reason)}</p>
            ${list(analysis.nextStep.actions)}
          `)}

          ${reportSection("Follow-Up And Handoff", `
            <h3 style="margin:0 0 8px;">Sales instructions</h3>
            ${list(analysis.salesInstructions)}
            <h3 style="margin:18px 0 8px;">Follow-up cadence</h3>
            ${list(analysis.followUpCadence)}
            <h3 style="margin:18px 0 8px;">Handoff checklist</h3>
            ${list(analysis.handoffChecklist)}
          `)}

          ${reportSection("Recorded Answers", rawAnswerRows ? reportTable([rawAnswerRows]) : "<p>No detailed answers recorded.</p>")}
        </main>
      </body>
    </html>
  `;
}

function buildSalesReportAttachment({ consultation, analysis }) {
  const reportHtml = buildSalesReportHtml({ consultation, analysis });
  const consultationNumber = safeFilenamePart(consultation.consultation_number);

  return {
    filename: `ReadyTech-Sales-Coach-Report-${consultationNumber}.html`,
    content: Buffer.from(reportHtml, "utf8").toString("base64"),
  };
}

async function sendSalesConsultationReport({ consultation, analysis, recipient }) {
  const recipients = buildSalesReportRecipients({ recipient });
  const client = getResend();
  const from =
    process.env.SALES_REPORT_FROM_EMAIL ||
    process.env.QUOTE_FROM_EMAIL ||
    "ReadyTech Sales Coach <onboarding@resend.dev>";

  const detailUrl = `${baseUrl()}/sales/consultations/${consultation.id}/results`;
  const attachment = buildSalesReportAttachment({ consultation, analysis });

  const body = `
    <p><strong>Salesperson:</strong> ${escapeHtml(consultation.salesperson_name)}<br>
       <strong>Salesperson email:</strong> ${escapeHtml(consultation.salesperson_email)}<br>
       <strong>Consultation:</strong> ${escapeHtml(consultation.consultation_number)}<br>
       <strong>Customer:</strong> ${escapeHtml(consultation.customer_name || "Not provided")}<br>
       <strong>Business:</strong> ${escapeHtml(consultation.business_name || "Not provided")}<br>
       <strong>Customer email:</strong> ${escapeHtml(consultation.customer_email || "Not provided")}<br>
       <strong>Customer phone:</strong> ${escapeHtml(consultation.customer_phone || "Not provided")}<br>
       <strong>Business type:</strong> ${escapeHtml(consultation.business_type || "Not provided")}<br>
       <strong>City / service area:</strong> ${escapeHtml(consultation.city || "Not provided")}<br>
       <strong>Completed:</strong> ${escapeHtml(formatDate(consultation.completed_at || consultation.updated_at))}</p>

    <table role="presentation" style="width:100%;border-collapse:collapse;margin:20px 0;">
      <tr>
        ${metric("Lead fit", `${analysis.leadFit} (${analysis.leadScore}/5)`)}
        ${metric("Business impact", `${analysis.impactLevel} (${analysis.impactScore}/100)`)}
        ${metric("Device count", analysis.monitoredDevices)}
        ${metric("Territory", analysis.territory.label)}
      </tr>
    </table>

    <h2 style="color:#f6a15f;">Primary recommendation</h2>
    <p><strong>${escapeHtml(analysis.primaryRecommendation.title)}</strong> — ${escapeHtml(analysis.primaryRecommendation.price)}</p>
    ${list(analysis.primaryRecommendation.reasons)}
    <p><strong>Talk track:</strong> ${escapeHtml(analysis.primaryRecommendation.talkTrack)}</p>

    <h2 style="color:#f6a15f;">Entry offer</h2>
    <p><strong>${escapeHtml(analysis.entryOffer.title)}</strong> — ${escapeHtml(analysis.entryOffer.price)}</p>

    <h2 style="color:#f6a15f;">Good / Better / Best</h2>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr>
          <th style="padding:10px;border-bottom:1px solid #e58336;text-align:left;">Option</th>
          <th style="padding:10px;border-bottom:1px solid #e58336;text-align:left;">Purpose</th>
          <th style="padding:10px;border-bottom:1px solid #e58336;text-align:left;">Recommendation</th>
          <th style="padding:10px;border-bottom:1px solid #e58336;text-align:left;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${analysis.goodBetterBest
          .map(
            (option) => `
              <tr>
                <td style="padding:10px;border-bottom:1px solid #30363d;">${escapeHtml(option.name)}</td>
                <td style="padding:10px;border-bottom:1px solid #30363d;">${escapeHtml(option.purpose)}</td>
                <td style="padding:10px;border-bottom:1px solid #30363d;">${escapeHtml(option.recommendation)}</td>
                <td style="padding:10px;border-bottom:1px solid #30363d;">${escapeHtml(option.price)}</td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>

    <h2 style="color:#f6a15f;">Required next step</h2>
    <p><strong>${escapeHtml(analysis.nextStep.title)}</strong></p>
    <p>${escapeHtml(analysis.nextStep.reason)}</p>
    ${list(analysis.nextStep.actions)}

    <h2 style="color:#f6a15f;">Survey and engineering</h2>
    <p><strong>Site survey required:</strong> ${analysis.surveyRequired ? "Yes" : "No"}<br>
       <strong>Engineering review required:</strong> ${analysis.engineeringRequired ? "Yes" : "No"}</p>
    ${analysis.surveyRequired ? `<h3>Survey reasons</h3>${list(analysis.surveyReasons)}` : ""}
    ${analysis.engineeringRequired ? `<h3>Engineering reasons</h3>${list(analysis.engineeringReasons)}` : ""}

    <h2 style="color:#f6a15f;">Cross-sell opportunities</h2>
    ${list(analysis.crossSells)}

    <h2 style="color:#f6a15f;">Objection guidance</h2>
    <p>${escapeHtml(analysis.objectionGuidance)}</p>

    <h2 style="color:#f6a15f;">Missing information</h2>
    ${list(analysis.missingInformation)}

    <h2 style="color:#f6a15f;">Pricing and promise controls</h2>
    <p>${escapeHtml(analysis.pricingStatement)}</p>
    <p>${escapeHtml(analysis.supportBoundary)}</p>

    <p style="margin-top:24px;">
      <a href="${escapeHtml(detailUrl)}" style="display:inline-block;background:#e58336;color:#120804;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px;">
        Open Sales Plan
      </a>
    </p>
  `;

  if (!client) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not configured.");
    }
    console.log(`[DEV SALES EMAIL] ${consultation.consultation_number} -> ${recipients.to.join(", ")}`);
    return { skipped: true, id: null, recipients: recipients.to, ownerCopyMissing: recipients.ownerCopyMissing };
  }

  const { data, error } = await client.emails.send({
    from,
    to: recipients.to,
    replyTo: consultation.customer_email || process.env.QUOTE_REPLY_TO || "contact@readytechinstalls.com",
    subject: `ReadyTech Sales Coach Report - ${consultation.consultation_number}`,
    html: shell(`Sales Coach Report ${consultation.consultation_number}`, body),
    attachments: [attachment],
  });

  if (error) throw new Error(`Resend error: ${error.message || JSON.stringify(error)}`);
  return { ...(data || { id: null }), recipients: recipients.to, ownerCopyMissing: recipients.ownerCopyMissing };
}

module.exports = {
  sendSalesConsultationReport,
  _testing: {
    normalizeEmailList,
    getOwnerReportRecipients,
    buildSalesReportRecipients,
    buildSalesReportHtml,
    buildSalesReportAttachment,
  },
};
