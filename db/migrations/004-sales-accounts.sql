CREATE TABLE IF NOT EXISTS sales_accounts (
  id BIGSERIAL PRIMARY KEY,
  salesperson_name VARCHAR(160) NOT NULL,
  email VARCHAR(320) NOT NULL UNIQUE,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS sales_accounts_active_idx
  ON sales_accounts (active);

CREATE INDEX IF NOT EXISTS sales_accounts_email_idx
  ON sales_accounts (LOWER(email));

CREATE INDEX IF NOT EXISTS sales_accounts_username_idx
  ON sales_accounts (LOWER(username));

CREATE TABLE IF NOT EXISTS sales_account_invites (
  id BIGSERIAL PRIMARY KEY,
  salesperson_name VARCHAR(160) NOT NULL,
  email VARCHAR(320) NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_by VARCHAR(160),
  account_id BIGINT REFERENCES sales_accounts (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS sales_account_invites_email_idx
  ON sales_account_invites (LOWER(email));

CREATE INDEX IF NOT EXISTS sales_account_invites_expires_at_idx
  ON sales_account_invites (expires_at);

CREATE TABLE IF NOT EXISTS sales_password_resets (
  id BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES sales_accounts (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS sales_password_resets_account_id_idx
  ON sales_password_resets (account_id);

CREATE INDEX IF NOT EXISTS sales_password_resets_expires_at_idx
  ON sales_password_resets (expires_at);
