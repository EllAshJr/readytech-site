"use strict";

const crypto = require("crypto");

const { getPool, query } = require("../db/pool");

const HASH_PREFIX = "scrypt";
const HASH_KEY_LENGTH = 64;
const MIN_PASSWORD_LENGTH = 10;
const DEFAULT_INVITE_HOURS = 7 * 24;
const DEFAULT_RESET_MINUTES = 60;

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function validateUsername(username) {
  const normalized = normalizeUsername(username);
  if (!/^[a-z0-9._-]{3,40}$/.test(normalized)) {
    return {
      ok: false,
      message: "Username must be 3-40 characters and use only letters, numbers, dots, dashes, or underscores.",
    };
  }
  return { ok: true, value: normalized };
}

function validateEmail(email) {
  const normalized = normalizeEmail(email);
  if (!/^\S+@\S+\.\S+$/.test(normalized)) {
    return { ok: false, message: "Enter a valid work email." };
  }
  return { ok: true, value: normalized };
}

function validateName(name) {
  const value = String(name || "").trim();
  if (!value) return { ok: false, message: "Enter the salesperson's name." };
  if (value.length > 160) return { ok: false, message: "Name is too long." };
  return { ok: true, value };
}

function validatePassword(password) {
  const value = String(password || "");
  if (value.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    return { ok: false, message: "Password must include at least one letter and one number." };
  }
  return { ok: true, value };
}

function generateToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function tokenHash(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function baseUrl(env = process.env) {
  return String(env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function signupUrl(token, env = process.env) {
  return `${baseUrl(env)}/sales/signup/${encodeURIComponent(token)}`;
}

function resetUrl(token, env = process.env) {
  return `${baseUrl(env)}/sales/reset/${encodeURIComponent(token)}`;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = crypto.scryptSync(String(password), salt, HASH_KEY_LENGTH).toString("base64url");
  return `${HASH_PREFIX}$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  try {
    const [prefix, salt, expectedHash] = String(storedHash || "").split("$");
    if (prefix !== HASH_PREFIX || !salt || !expectedHash) return false;

    const actual = crypto.scryptSync(String(password || ""), salt, HASH_KEY_LENGTH);
    const expected = Buffer.from(expectedHash, "base64url");
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function accountSetupError(error) {
  return (
    /sales_accounts|sales_account_invites|sales_password_resets|DATABASE_URL/.test(error.message || "") ||
    error.code === "42P01"
  );
}

function accountConflictMessage(error) {
  if (error.code !== "23505") return "";
  return "That username or email is already registered.";
}

function tokenHours(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 24 * 30) : fallback;
}

function tokenMinutes(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 24 * 60) : fallback;
}

async function createSalesInvite({ name, email, createdBy = "owner", env = process.env } = {}) {
  const validName = validateName(name);
  if (!validName.ok) return validName;

  const validEmail = validateEmail(email);
  if (!validEmail.ok) return validEmail;

  const token = generateToken();
  const expiresHours = tokenHours(env.SALES_INVITE_EXPIRES_HOURS, DEFAULT_INVITE_HOURS);

  try {
    const existing = await query(
      `
        SELECT id
        FROM sales_accounts
        WHERE email = $1 AND active = TRUE
        LIMIT 1
      `,
      [validEmail.value],
    );

    if (existing.rows[0]) {
      return { ok: false, message: "A Sales Coach account already exists for that email." };
    }

    const result = await query(
      `
        INSERT INTO sales_account_invites (
          salesperson_name,
          email,
          token_hash,
          created_by,
          expires_at
        )
        VALUES ($1, $2, $3, $4, NOW() + ($5::text || ' hours')::interval)
        RETURNING id, salesperson_name, email, created_by, created_at, expires_at
      `,
      [validName.value, validEmail.value, tokenHash(token), String(createdBy || "owner").trim(), expiresHours],
    );

    return {
      ok: true,
      invite: result.rows[0],
      token,
      signupUrl: signupUrl(token, env),
    };
  } catch (error) {
    if (accountSetupError(error)) {
      return { ok: false, setupError: true, message: "Sales account invite storage is not ready." };
    }
    throw error;
  }
}

async function getSignupInvite(token) {
  const hash = tokenHash(token);

  try {
    const result = await query(
      `
        SELECT id, salesperson_name, email, created_at, expires_at, used_at
        FROM sales_account_invites
        WHERE token_hash = $1
        LIMIT 1
      `,
      [hash],
    );

    const invite = result.rows[0];
    if (!invite) return { ok: false, message: "Invite link is invalid." };
    if (invite.used_at) return { ok: false, message: "Invite link has already been used." };
    if (new Date(invite.expires_at).getTime() <= Date.now()) {
      return { ok: false, message: "Invite link has expired." };
    }

    return { ok: true, invite };
  } catch (error) {
    if (accountSetupError(error)) {
      return { ok: false, setupError: true, message: "Sales account invite storage is not ready." };
    }
    throw error;
  }
}

async function createSalesAccount({ inviteToken, username, password, confirmPassword }) {
  const validUsername = validateUsername(username);
  if (!validUsername.ok) return validUsername;

  const validPassword = validatePassword(password);
  if (!validPassword.ok) return validPassword;

  if (String(password || "") !== String(confirmPassword || "")) {
    return { ok: false, message: "Passwords do not match." };
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const inviteResult = await client.query(
      `
        SELECT id, salesperson_name, email, expires_at, used_at
        FROM sales_account_invites
        WHERE token_hash = $1
        LIMIT 1
        FOR UPDATE
      `,
      [tokenHash(inviteToken)],
    );

    const invite = inviteResult.rows[0];
    if (!invite) {
      await client.query("ROLLBACK");
      return { ok: false, message: "Invite link is invalid." };
    }
    if (invite.used_at) {
      await client.query("ROLLBACK");
      return { ok: false, message: "Invite link has already been used." };
    }
    if (new Date(invite.expires_at).getTime() <= Date.now()) {
      await client.query("ROLLBACK");
      return { ok: false, message: "Invite link has expired." };
    }

    const accountResult = await client.query(
      `
        INSERT INTO sales_accounts (
          salesperson_name,
          email,
          username,
          password_hash
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id, salesperson_name, email, username
      `,
      [invite.salesperson_name, invite.email, validUsername.value, hashPassword(validPassword.value)],
    );

    await client.query(
      `
        UPDATE sales_account_invites
        SET used_at = NOW(), account_id = $2
        WHERE id = $1
      `,
      [invite.id, accountResult.rows[0].id],
    );

    await client.query("COMMIT");
    return { ok: true, account: accountResult.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    const conflict = accountConflictMessage(error);
    if (conflict) return { ok: false, message: conflict };
    if (accountSetupError(error)) {
      return { ok: false, setupError: true, message: "Sales account storage is not ready." };
    }
    throw error;
  } finally {
    client.release();
  }
}

async function authenticateSalesAccount(username, password) {
  const validUsername = validateUsername(username);
  if (!validUsername.ok || !password) return null;

  try {
    const result = await query(
      `
        SELECT id, salesperson_name, email, username, password_hash
        FROM sales_accounts
        WHERE username = $1 AND active = TRUE
        LIMIT 1
      `,
      [validUsername.value],
    );

    const account = result.rows[0];
    if (!account || !verifyPassword(password, account.password_hash)) return null;

    await query(
      `UPDATE sales_accounts SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [account.id],
    );

    return {
      id: account.id,
      name: account.salesperson_name,
      email: account.email,
      username: account.username,
    };
  } catch (error) {
    if (accountSetupError(error)) return null;
    throw error;
  }
}

async function findAccountByEmail(email) {
  const validEmail = validateEmail(email);
  if (!validEmail.ok) return validEmail;

  try {
    const result = await query(
      `
        SELECT id, salesperson_name, email, username
        FROM sales_accounts
        WHERE email = $1 AND active = TRUE
        LIMIT 1
      `,
      [validEmail.value],
    );

    return { ok: true, account: result.rows[0] || null };
  } catch (error) {
    if (accountSetupError(error)) {
      return { ok: false, setupError: true, message: "Sales account storage is not ready." };
    }
    throw error;
  }
}

async function createPasswordReset({ email, env = process.env } = {}) {
  const accountResult = await findAccountByEmail(email);
  if (!accountResult.ok || !accountResult.account) return accountResult;

  const token = generateToken();
  const expiresMinutes = tokenMinutes(env.SALES_PASSWORD_RESET_EXPIRES_MINUTES, DEFAULT_RESET_MINUTES);

  try {
    const result = await query(
      `
        INSERT INTO sales_password_resets (
          account_id,
          token_hash,
          expires_at
        )
        VALUES ($1, $2, NOW() + ($3::text || ' minutes')::interval)
        RETURNING id, account_id, created_at, expires_at
      `,
      [accountResult.account.id, tokenHash(token), expiresMinutes],
    );

    return {
      ok: true,
      account: accountResult.account,
      reset: result.rows[0],
      token,
      resetUrl: resetUrl(token, env),
    };
  } catch (error) {
    if (accountSetupError(error)) {
      return { ok: false, setupError: true, message: "Sales password reset storage is not ready." };
    }
    throw error;
  }
}

async function getPasswordReset(token) {
  try {
    const result = await query(
      `
        SELECT
          sales_password_resets.id,
          sales_password_resets.account_id,
          sales_password_resets.expires_at,
          sales_password_resets.used_at,
          sales_accounts.salesperson_name,
          sales_accounts.email,
          sales_accounts.username
        FROM sales_password_resets
        JOIN sales_accounts ON sales_accounts.id = sales_password_resets.account_id
        WHERE sales_password_resets.token_hash = $1
          AND sales_accounts.active = TRUE
        LIMIT 1
      `,
      [tokenHash(token)],
    );

    const reset = result.rows[0];
    if (!reset) return { ok: false, message: "Password reset link is invalid." };
    if (reset.used_at) return { ok: false, message: "Password reset link has already been used." };
    if (new Date(reset.expires_at).getTime() <= Date.now()) {
      return { ok: false, message: "Password reset link has expired." };
    }

    return { ok: true, reset };
  } catch (error) {
    if (accountSetupError(error)) {
      return { ok: false, setupError: true, message: "Sales password reset storage is not ready." };
    }
    throw error;
  }
}

async function resetSalesAccountPassword({ resetToken, password, confirmPassword }) {
  const validPassword = validatePassword(password);
  if (!validPassword.ok) return validPassword;

  if (String(password || "") !== String(confirmPassword || "")) {
    return { ok: false, message: "Passwords do not match." };
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const resetResult = await client.query(
      `
        SELECT
          sales_password_resets.id,
          sales_password_resets.account_id,
          sales_password_resets.expires_at,
          sales_password_resets.used_at,
          sales_accounts.salesperson_name,
          sales_accounts.email,
          sales_accounts.username
        FROM sales_password_resets
        JOIN sales_accounts ON sales_accounts.id = sales_password_resets.account_id
        WHERE sales_password_resets.token_hash = $1
          AND sales_accounts.active = TRUE
        LIMIT 1
        FOR UPDATE
      `,
      [tokenHash(resetToken)],
    );

    const reset = resetResult.rows[0];
    if (!reset) {
      await client.query("ROLLBACK");
      return { ok: false, message: "Password reset link is invalid." };
    }
    if (reset.used_at) {
      await client.query("ROLLBACK");
      return { ok: false, message: "Password reset link has already been used." };
    }
    if (new Date(reset.expires_at).getTime() <= Date.now()) {
      await client.query("ROLLBACK");
      return { ok: false, message: "Password reset link has expired." };
    }

    const accountResult = await client.query(
      `
        UPDATE sales_accounts
        SET password_hash = $2, updated_at = NOW()
        WHERE id = $1 AND active = TRUE
        RETURNING id, salesperson_name, email, username
      `,
      [reset.account_id, hashPassword(validPassword.value)],
    );

    await client.query(
      `UPDATE sales_password_resets SET used_at = NOW() WHERE id = $1`,
      [reset.id],
    );

    await client.query("COMMIT");
    return { ok: true, account: accountResult.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    if (accountSetupError(error)) {
      return { ok: false, setupError: true, message: "Sales account storage is not ready." };
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createSalesInvite,
  getSignupInvite,
  createSalesAccount,
  authenticateSalesAccount,
  findAccountByEmail,
  createPasswordReset,
  getPasswordReset,
  resetSalesAccountPassword,
  _testing: {
    normalizeUsername,
    normalizeEmail,
    validateUsername,
    validateEmail,
    validatePassword,
    generateToken,
    tokenHash,
    signupUrl,
    resetUrl,
    hashPassword,
    verifyPassword,
  },
};
