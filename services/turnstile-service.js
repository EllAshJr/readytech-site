"use strict";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function getClientIp(req) {
  const cloudflareIp = req.get("CF-Connecting-IP");
  if (cloudflareIp) return cloudflareIp;

  const forwarded = req.get("X-Forwarded-For");
  if (forwarded) return forwarded.split(",")[0].trim();

  return req.ip || req.socket?.remoteAddress || "";
}

async function validateTurnstile(token, req) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return {
        success: false,
        errorCodes: ["turnstile-not-configured"],
      };
    }

    console.warn("TURNSTILE_SECRET_KEY is not set; Turnstile validation is bypassed outside production.");
    return { success: true, bypassed: true };
  }

  if (!token || typeof token !== "string" || token.length > 2048) {
    return { success: false, errorCodes: ["missing-or-invalid-token"] };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: getClientIp(req),
      }),
      signal: controller.signal,
    });

    const result = await response.json();
    if (!result.success) {
      return {
        success: false,
        errorCodes: result["error-codes"] || ["turnstile-failed"],
      };
    }

    const expectedHostname = process.env.TURNSTILE_EXPECTED_HOSTNAME;
    if (expectedHostname && result.hostname !== expectedHostname) {
      return {
        success: false,
        errorCodes: ["hostname-mismatch"],
      };
    }

    return { success: true, result };
  } catch (error) {
    console.error("Turnstile validation error:", error.message);
    return {
      success: false,
      errorCodes: [error.name === "AbortError" ? "validation-timeout" : "internal-error"],
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  validateTurnstile,
};
