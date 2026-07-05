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

function fromAddress() {
  return (
    process.env.SALES_ACCOUNT_FROM_EMAIL ||
    process.env.SALES_REPORT_FROM_EMAIL ||
    process.env.QUOTE_FROM_EMAIL ||
    "ReadyTech Sales Coach <onboarding@resend.dev>"
  );
}

function shell(title, body) {
  return `
    <!doctype html>
    <html>
      <body style="margin:0;background:#0d1117;color:#e5e7eb;font-family:Arial,Helvetica,sans-serif;line-height:1.55;">
        <div style="max-width:720px;margin:0 auto;padding:32px 18px;">
          <div style="background:#161b22;border:1px solid #30363d;border-radius:14px;padding:28px;">
            <p style="margin:0 0 8px;color:#f6a15f;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">ReadyTech Sales Coach</p>
            <h1 style="margin:0 0 20px;color:#ffffff;font-size:26px;">${escapeHtml(title)}</h1>
            ${body}
          </div>
        </div>
      </body>
    </html>
  `;
}

async function sendAccountEmail({ to, subject, html, text, logger = console }) {
  const client = getResend();

  if (!client) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not configured.");
    }

    if (logger && typeof logger.log === "function") {
      logger.log(`[DEV SALES ACCOUNT EMAIL] ${subject} -> ${to}`);
      logger.log(text);
    }
    return { skipped: true, id: null };
  }

  const { data, error } = await client.emails.send({
    from: fromAddress(),
    to,
    subject,
    html,
    text,
  });

  if (error) throw new Error(`Resend error: ${error.message || JSON.stringify(error)}`);
  return data || { id: null };
}

async function sendSalesInviteEmail({ invite, signupUrl, logger = console }) {
  const subject = "Create your ReadyTech Sales Coach account";
  const text = [
    `Hi ${invite.salesperson_name},`,
    "",
    "Use this one-time link to create your ReadyTech Sales Coach account:",
    signupUrl,
    "",
    "This invite is tied to your email and expires automatically.",
  ].join("\n");

  const html = shell(
    "Create your Sales Coach account",
    `
      <p>Hi ${escapeHtml(invite.salesperson_name)},</p>
      <p>Use this one-time link to create your ReadyTech Sales Coach account:</p>
      <p><a href="${escapeHtml(signupUrl)}" style="display:inline-block;background:#e58336;color:#120804;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px;">Create account</a></p>
      <p style="color:#9ca3af;font-size:13px;">This invite is tied to your email and expires automatically.</p>
    `,
  );

  return sendAccountEmail({
    to: invite.email,
    subject,
    html,
    text,
    logger,
  });
}

async function sendUsernameReminderEmail({ account, logger = console }) {
  const subject = "Your ReadyTech Sales Coach username";
  const text = [
    `Hi ${account.salesperson_name},`,
    "",
    `Your ReadyTech Sales Coach username is: ${account.username}`,
  ].join("\n");

  const html = shell(
    "Your Sales Coach username",
    `
      <p>Hi ${escapeHtml(account.salesperson_name)},</p>
      <p>Your ReadyTech Sales Coach username is:</p>
      <p style="font-size:20px;font-weight:700;color:#ffffff;">${escapeHtml(account.username)}</p>
    `,
  );

  return sendAccountEmail({
    to: account.email,
    subject,
    html,
    text,
    logger,
  });
}

async function sendPasswordResetEmail({ account, resetUrl, logger = console }) {
  const subject = "Reset your ReadyTech Sales Coach password";
  const text = [
    `Hi ${account.salesperson_name},`,
    "",
    "Use this one-time link to reset your ReadyTech Sales Coach password:",
    resetUrl,
    "",
    "This link expires automatically. If you did not request this, ignore this email.",
  ].join("\n");

  const html = shell(
    "Reset your Sales Coach password",
    `
      <p>Hi ${escapeHtml(account.salesperson_name)},</p>
      <p>Use this one-time link to reset your ReadyTech Sales Coach password:</p>
      <p><a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#e58336;color:#120804;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px;">Reset password</a></p>
      <p style="color:#9ca3af;font-size:13px;">This link expires automatically. If you did not request this, ignore this email.</p>
    `,
  );

  return sendAccountEmail({
    to: account.email,
    subject,
    html,
    text,
    logger,
  });
}

module.exports = {
  sendSalesInviteEmail,
  sendUsernameReminderEmail,
  sendPasswordResetEmail,
  _testing: {
    escapeHtml,
    fromAddress,
  },
};
