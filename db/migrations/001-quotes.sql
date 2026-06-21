CREATE TABLE IF NOT EXISTS quotes (
  id BIGSERIAL PRIMARY KEY,
  quote_number VARCHAR(32) UNIQUE NOT NULL,
  customer_name VARCHAR(160) NOT NULL,
  customer_email VARCHAR(320) NOT NULL,
  customer_phone VARCHAR(80),
  business_name VARCHAR(200) NOT NULL,
  business_type VARCHAR(80) NOT NULL,
  city VARCHAR(120) NOT NULL,
  zip_code VARCHAR(16) NOT NULL,
  location_count INTEGER NOT NULL CHECK (location_count > 0),
  selected_services JSONB NOT NULL,
  answers JSONB NOT NULL,
  line_items JSONB NOT NULL,
  setup_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  monthly_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  complexity_level VARCHAR(32) NOT NULL,
  manual_review BOOLEAN NOT NULL DEFAULT FALSE,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  assumptions JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(48) NOT NULL DEFAULT 'draft',
  decision_token_hash CHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  decision_at TIMESTAMPTZ,
  requested_call_at TIMESTAMPTZ,
  rejection_reason VARCHAR(160),
  rejection_details VARCHAR(1000),
  customer_email_id VARCHAR(160),
  owner_email_id VARCHAR(160)
);

CREATE INDEX IF NOT EXISTS quotes_status_idx ON quotes(status);
CREATE INDEX IF NOT EXISTS quotes_customer_email_idx ON quotes(customer_email);
CREATE INDEX IF NOT EXISTS quotes_expires_at_idx ON quotes(expires_at);

CREATE OR REPLACE FUNCTION set_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS quotes_set_updated_at ON quotes;
CREATE TRIGGER quotes_set_updated_at
BEFORE UPDATE ON quotes
FOR EACH ROW
EXECUTE FUNCTION set_quotes_updated_at();
