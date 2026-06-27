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

async function sendSalesConsultationReport({ consultation, analysis, recipient }) {
  const client = getResend();
  const from =
    process.env.SALES_REPORT_FROM_EMAIL ||
    process.env.QUOTE_FROM_EMAIL ||
    "ReadyTech Sales Coach <onboarding@resend.dev>";

  const detailUrl = `${baseUrl()}/sales/consultations/${consultation.id}/results`;

  const recommendations = [
    analysis.primaryRecommendation,
    ...(analysis.secondaryRecommendations || []),
  ];

  const body = `
    <p><strong>Salesperson:</strong> ${escapeHtml(consultation.salesperson_name)}<br>
       <strong>Consultation:</strong> ${escapeHtml(consultation.consultation_number)}<br>
       <strong>Customer:</strong> ${escapeHtml(consultation.customer_name || "Not provided")}<br>
       <strong>Business:</strong> ${escapeHtml(consultation.business_name || "Not provided")}<br>
       <strong>Customer email:</strong> ${escapeHtml(consultation.customer_email || "Not provided")}<br>
       <strong>Customer phone:</strong> ${escapeHtml(consultation.customer_phone || "Not provided")}<br>
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
    console.log(`[DEV SALES EMAIL] ${consultation.consultation_number} -> ${recipient}`);
    return { skipped: true, id: null };
  }

  const to = [recipient];
  if (process.env.SALES_OWNER_COPY_EMAIL) to.push(process.env.SALES_OWNER_COPY_EMAIL);

  const { data, error } = await client.emails.send({
    from,
    to,
    replyTo: consultation.customer_email || process.env.QUOTE_REPLY_TO || "contact@readytechinstalls.com",
    subject: `ReadyTech sales plan: ${consultation.business_name || consultation.consultation_number}`,
    html: shell(`Sales plan ${consultation.consultation_number}`, body),
  });

  if (error) throw new Error(`Resend error: ${error.message || JSON.stringify(error)}`);
  return data || { id: null };
}

module.exports = {
  sendSalesConsultationReport,
};
