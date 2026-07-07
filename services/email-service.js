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

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function date(value) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  }).format(new Date(value));
}

function baseUrl() {
  return String(process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function decisionUrl(quote, rawToken) {
  return `${baseUrl()}/estimate/${encodeURIComponent(quote.quote_number)}/${encodeURIComponent(rawToken)}`;
}

function emailShell(title, body) {
  return `
    <!doctype html>
    <html>
      <body style="margin:0;background:#0d1117;color:#e5e7eb;font-family:Arial,Helvetica,sans-serif;line-height:1.55;">
        <div style="max-width:720px;margin:0 auto;padding:32px 18px;">
          <div style="background:#161b22;border:1px solid #30363d;border-radius:14px;padding:28px;">
            <p style="margin:0 0 8px;color:#f6a15f;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">ReadyTech</p>
            <h1 style="margin:0 0 20px;color:#ffffff;font-size:28px;">${escapeHtml(title)}</h1>
            ${body}
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:18px;">
            ReadyTech · readytechinstalls.com
          </p>
        </div>
      </body>
    </html>
  `;
}

function lineItemsTable(lineItems) {
  const rows = (lineItems || [])
    .map(
      (item) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #30363d;">${escapeHtml(item.name)}</td>
          <td style="padding:10px;border-bottom:1px solid #30363d;text-align:right;">${money(item.setup)}</td>
          <td style="padding:10px;border-bottom:1px solid #30363d;text-align:right;">${money(item.monthly)}/mo</td>
        </tr>
      `,
    )
    .join("");

  return `
    <table role="presentation" style="width:100%;border-collapse:collapse;margin:18px 0;">
      <thead>
        <tr>
          <th style="padding:10px;text-align:left;border-bottom:1px solid #e58336;">Service</th>
          <th style="padding:10px;text-align:right;border-bottom:1px solid #e58336;">Setup</th>
          <th style="padding:10px;text-align:right;border-bottom:1px solid #e58336;">Monthly</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function list(items) {
  if (!items || items.length === 0) return "";
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

async function sendEmail({ to, subject, html, replyTo, idempotencyKey, from }) {
  const client = getResend();
  const fromAddress =
    from || process.env.QUOTE_FROM_EMAIL || "ReadyTech Estimates <onboarding@resend.dev>";

  if (!client) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not configured.");
    }
    console.log(`[DEV EMAIL] ${subject} -> ${to}`);
    return { skipped: true, id: null };
  }

  const { data, error } = await client.emails.send(
    {
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      replyTo: replyTo || process.env.QUOTE_REPLY_TO || "contact@readytechinstalls.com",
      subject,
      html,
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  );

  if (error) throw new Error(`Resend error: ${error.message || JSON.stringify(error)}`);
  return data || { id: null };
}

async function sendInitialEstimateEmails({ quote, rawToken }) {
  const url = decisionUrl(quote, rawToken);
  const ownerEmail = process.env.OWNER_EMAIL;

  if (!ownerEmail && process.env.NODE_ENV === "production") {
    throw new Error("OWNER_EMAIL is not configured.");
  }

  const customerBody = `
    <p>Hello ${escapeHtml(quote.customer_name)},</p>
    <p>Your ReadyTech instant estimate for <strong>${escapeHtml(quote.business_name)}</strong> is ready.</p>
    <p><strong>Estimate number:</strong> ${escapeHtml(quote.quote_number)}<br>
       <strong>Estimated setup:</strong> ${money(quote.setup_total)}<br>
       <strong>Estimated monthly service:</strong> ${money(quote.monthly_total)}/month<br>
       <strong>Valid through:</strong> ${date(quote.expires_at)}</p>
    ${lineItemsTable(quote.line_items)}
    <p style="margin:24px 0;">
      <a href="${escapeHtml(url)}" style="display:inline-block;background:#e58336;color:#120804;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px;">
        View and Respond to Estimate
      </a>
    </p>
    <p><strong>Important:</strong> This is a non-binding estimate pending final technical verification and scheduling.</p>
    <h3>Assumptions and exclusions</h3>
    ${list(quote.assumptions)}
  `;

  const ownerBody = `
    <p>A new ReadyTech estimate request was submitted.</p>
    <p><strong>Estimate:</strong> ${escapeHtml(quote.quote_number)}<br>
       <strong>Customer:</strong> ${escapeHtml(quote.customer_name)}<br>
       <strong>Business:</strong> ${escapeHtml(quote.business_name)}<br>
       <strong>Email:</strong> ${escapeHtml(quote.customer_email)}<br>
       <strong>Phone:</strong> ${escapeHtml(quote.customer_phone || "Not provided")}<br>
       <strong>Location:</strong> ${escapeHtml(quote.city)}, ${escapeHtml(quote.zip_code)}<br>
       <strong>Business type:</strong> ${escapeHtml(quote.business_type)}<br>
       <strong>Complexity:</strong> ${escapeHtml(quote.complexity_level)}<br>
       <strong>Manual review:</strong> ${quote.manual_review ? "Yes" : "No"}</p>
    ${lineItemsTable(quote.line_items)}
    <p><strong>Setup total:</strong> ${money(quote.setup_total)}<br>
       <strong>Monthly total:</strong> ${money(quote.monthly_total)}/month</p>
    <h3>Warnings</h3>
    ${list(quote.warnings)}
    <h3>Customer answers</h3>
    <pre style="white-space:pre-wrap;background:#05070a;padding:14px;border-radius:8px;color:#e5e7eb;">${escapeHtml(
      JSON.stringify(quote.answers, null, 2),
    )}</pre>
    <p><a href="${escapeHtml(url)}">Open secure estimate page</a></p>
  `;

  const customerResult = await sendEmail({
    to: quote.customer_email,
    subject: `ReadyTech estimate ${quote.quote_number}`,
    html: emailShell(`Your estimate ${quote.quote_number}`, customerBody),
    replyTo: process.env.QUOTE_REPLY_TO,
    idempotencyKey: `quote-${quote.id}-customer-v1`,
  });

  const ownerResult = ownerEmail
    ? await sendEmail({
        to: ownerEmail,
        subject: `New ReadyTech estimate: ${quote.quote_number} — ${quote.business_name}`,
        html: emailShell(`New estimate ${quote.quote_number}`, ownerBody),
        replyTo: quote.customer_email,
        idempotencyKey: `quote-${quote.id}-owner-v1`,
      })
    : { skipped: true, id: null };

  return {
    customerEmailId: customerResult.id || null,
    ownerEmailId: ownerResult.id || null,
  };
}

async function sendDecisionEmails({ quote, decision, reason = "", details = "" }) {
  const accepted = decision === "accepted";
  const ownerEmail = process.env.OWNER_EMAIL;
  const title = accepted ? "Estimate accepted" : "Estimate declined";
  const statusText = accepted
    ? "The customer accepted the estimate and requested final verification and scheduling."
    : "The customer declined the estimate.";

  const customerBody = `
    <p>Hello ${escapeHtml(quote.customer_name)},</p>
    <p>${escapeHtml(statusText)}</p>
    <p><strong>Estimate:</strong> ${escapeHtml(quote.quote_number)}<br>
       <strong>Setup:</strong> ${money(quote.setup_total)}<br>
       <strong>Monthly:</strong> ${money(quote.monthly_total)}/month</p>
    ${accepted ? "<p>ReadyTech will follow up to verify the scope and discuss scheduling.</p>" : "<p>Thank you for considering ReadyTech. You may reply if you would like a revised scope.</p>"}
  `;

  const ownerBody = `
    <p>${escapeHtml(statusText)}</p>
    <p><strong>Estimate:</strong> ${escapeHtml(quote.quote_number)}<br>
       <strong>Customer:</strong> ${escapeHtml(quote.customer_name)}<br>
       <strong>Business:</strong> ${escapeHtml(quote.business_name)}<br>
       <strong>Email:</strong> ${escapeHtml(quote.customer_email)}<br>
       <strong>Reason:</strong> ${escapeHtml(reason || "Not provided")}<br>
       <strong>Details:</strong> ${escapeHtml(details || "Not provided")}</p>
  `;

  await sendEmail({
    to: quote.customer_email,
    subject: `ReadyTech estimate ${quote.quote_number}: ${accepted ? "accepted" : "declined"}`,
    html: emailShell(title, customerBody),
    idempotencyKey: `quote-${quote.id}-${decision}-customer-v1`,
  });

  if (ownerEmail) {
    await sendEmail({
      to: ownerEmail,
      subject: `${accepted ? "ACCEPTED" : "DECLINED"}: ${quote.quote_number} — ${quote.business_name}`,
      html: emailShell(title, ownerBody),
      replyTo: quote.customer_email,
      idempotencyKey: `quote-${quote.id}-${decision}-owner-v1`,
    });
  }
}

async function sendCallRequestEmails({ quote }) {
  const ownerEmail = process.env.OWNER_EMAIL;
  const customerBody = `
    <p>Hello ${escapeHtml(quote.customer_name)},</p>
    <p>Your request for a ReadyTech consultation about estimate <strong>${escapeHtml(quote.quote_number)}</strong> has been recorded.</p>
    <p>ReadyTech will follow up using the contact information you provided.</p>
  `;

  await sendEmail({
    to: quote.customer_email,
    subject: `ReadyTech call request for ${quote.quote_number}`,
    html: emailShell("Call request received", customerBody),
    idempotencyKey: `quote-${quote.id}-call-customer-v1`,
  });

  if (ownerEmail) {
    await sendEmail({
      to: ownerEmail,
      subject: `CALL REQUEST: ${quote.quote_number} — ${quote.business_name}`,
      html: emailShell(
        "Customer requested a call",
        `<p>${escapeHtml(quote.customer_name)} requested a call about ${escapeHtml(quote.quote_number)}.</p>
         <p><strong>Email:</strong> ${escapeHtml(quote.customer_email)}<br>
            <strong>Phone:</strong> ${escapeHtml(quote.customer_phone || "Not provided")}</p>`,
      ),
      replyTo: quote.customer_email,
      idempotencyKey: `quote-${quote.id}-call-owner-v1`,
    });
  }
}

async function sendContactRequestEmail({ submission }) {
  const ownerEmail = process.env.OWNER_EMAIL;

  if (!ownerEmail && process.env.NODE_ENV === "production") {
    throw new Error("OWNER_EMAIL is not configured.");
  }

  const subject = `ReadyTech contact request: ${submission.service || "General request"}`;
  const body = `
    <p>A new ReadyTech contact request was submitted from the website.</p>
    <p><strong>Name:</strong> ${escapeHtml(submission.name)}<br>
       <strong>Email:</strong> ${escapeHtml(submission.email)}<br>
       <strong>Phone:</strong> ${escapeHtml(submission.phone || "Not provided")}<br>
       <strong>City:</strong> ${escapeHtml(submission.city || "Not provided")}<br>
       <strong>Service interest:</strong> ${escapeHtml(submission.service || "Not provided")}</p>
    <h3>Message</h3>
    <p>${escapeHtml(submission.message).replace(/\n/g, "<br>")}</p>
  `;

  if (!ownerEmail) {
    console.log(`[DEV CONTACT EMAIL] ${subject} -> OWNER_EMAIL not set`);
    console.log(JSON.stringify(submission, null, 2));
    return { skipped: true, id: null };
  }

  return sendEmail({
    to: ownerEmail,
    subject,
    html: emailShell("New ReadyTech contact request", body),
    replyTo: submission.email || process.env.QUOTE_REPLY_TO,
  });
}

async function sendCoIndustryLeadEmail({ business, submission }) {
  const leadEmail = process.env.CO_INDUSTRY_LEAD_EMAIL || process.env.OWNER_EMAIL;

  if (!leadEmail && process.env.NODE_ENV === "production") {
    throw new Error("CO_INDUSTRY_LEAD_EMAIL or OWNER_EMAIL is not configured.");
  }

  const subject = `${business.shortName} quote request: ${
    submission.service || "General request"
  }`;
  const body = `
    <p>A new quote/contact request was submitted for <strong>${escapeHtml(
      business.name,
    )}</strong>.</p>
    <p><strong>Business:</strong> ${escapeHtml(business.name)}<br>
       <strong>Byline:</strong> ${escapeHtml(business.byline)}<br>
       <strong>Requested service:</strong> ${escapeHtml(
         submission.service || "Not provided",
       )}<br>
       <strong>Name:</strong> ${escapeHtml(submission.name)}<br>
       <strong>Email:</strong> ${escapeHtml(submission.email)}<br>
       <strong>Phone:</strong> ${escapeHtml(submission.phone || "Not provided")}<br>
       <strong>City / job location:</strong> ${escapeHtml(
         submission.city || "Not provided",
       )}</p>
    <h3>Message</h3>
    <p>${escapeHtml(submission.message).replace(/\n/g, "<br>")}</p>
  `;

  if (!leadEmail) {
    console.log(`[DEV CO-INDUSTRY EMAIL] ${subject} -> CO_INDUSTRY_LEAD_EMAIL not set`);
    console.log(JSON.stringify({ business: business.name, submission }, null, 2));
    return { skipped: true, id: null };
  }

  return sendEmail({
    to: leadEmail,
    subject,
    html: emailShell(`New ${business.shortName} request`, body),
    replyTo: submission.email || process.env.QUOTE_REPLY_TO,
    from: process.env.CO_INDUSTRY_FROM_EMAIL,
  });
}

module.exports = {
  sendInitialEstimateEmails,
  sendDecisionEmails,
  sendCallRequestEmails,
  sendCoIndustryLeadEmail,
  sendContactRequestEmail,
  decisionUrl,
};
