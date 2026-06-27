"use strict";

const crypto = require("crypto");

const DEV_USERNAME = "sales";
const DEV_PASSWORD = "readytech";
const DEV_SECRET = "readytech-development-sales-secret-change-me";

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function cookieName() {
  return isProduction() ? "__Host-readytech_sales" : "readytech_sales";
}

function parseCookies(header = "") {
  const result = {};
  for (const pair of String(header).split(";")) {
    const index = pair.indexOf("=");
    if (index === -1) continue;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (key) result[key] = decodeURIComponent(value);
  }
  return result;
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function credentials() {
  const username = process.env.SALES_APP_USERNAME || (!isProduction() ? DEV_USERNAME : "");
  const password = process.env.SALES_APP_PASSWORD || (!isProduction() ? DEV_PASSWORD : "");

  if (!username || !password) {
    throw new Error(
      "SALES_APP_USERNAME and SALES_APP_PASSWORD must be configured in production.",
    );
  }

  return { username, password };
}

function sessionSecret() {
  const secret = process.env.SALES_SESSION_SECRET || (!isProduction() ? DEV_SECRET : "");
  if (!secret) throw new Error("SALES_SESSION_SECRET must be configured in production.");
  return secret;
}

function sessionHours() {
  const value = Number(process.env.SALES_SESSION_HOURS || 8);
  return Number.isFinite(value) && value > 0 ? Math.min(value, 24) : 8;
}

function sign(value) {
  return crypto.createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function createSessionToken({ name, email, username }) {
  const now = Date.now();
  const payload = {
    v: 1,
    username,
    name,
    email,
    csrf: crypto.randomBytes(24).toString("base64url"),
    iat: now,
    exp: now + sessionHours() * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function verifySessionToken(token) {
  try {
    const [encoded, signature] = String(token || "").split(".");
    if (!encoded || !signature || !safeEqual(signature, sign(encoded))) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp <= Date.now()) return null;
    if (!payload.email || !payload.name || !payload.csrf) return null;
    return payload;
  } catch {
    return null;
  }
}

function setSessionCookie(res, token) {
  const parts = [
    `${cookieName()}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.floor(sessionHours() * 60 * 60)}`,
  ];
  if (isProduction()) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function clearSessionCookie(res) {
  const parts = [
    `${cookieName()}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (isProduction()) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function sessionFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie);
  return verifySessionToken(cookies[cookieName()]);
}

function authenticate(username, password) {
  const expected = credentials();
  return safeEqual(username, expected.username) && safeEqual(password, expected.password);
}

function attachSession(req, res, next) {
  const session = sessionFromRequest(req);
  req.salesSession = session;
  res.locals.salesSession = session;
  res.locals.salesCsrf = session ? session.csrf : "";
  next();
}

function requireSalesAuth(req, res, next) {
  if (!req.salesSession) {
    const returnTo = encodeURIComponent(req.originalUrl || "/sales");
    return res.redirect(`/sales/login?returnTo=${returnTo}`);
  }
  return next();
}

function requireCsrf(req, res, next) {
  if (!req.salesSession || !safeEqual(req.body._csrf, req.salesSession.csrf)) {
    return res.status(403).send("The sales session security token is invalid or expired.");
  }
  return next();
}

function defaultHintAvailable() {
  return !isProduction() && !process.env.SALES_APP_USERNAME && !process.env.SALES_APP_PASSWORD;
}

module.exports = {
  authenticate,
  attachSession,
  requireSalesAuth,
  requireCsrf,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  defaultHintAvailable,
  credentials,
};
