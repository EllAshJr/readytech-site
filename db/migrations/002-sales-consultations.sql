CREATE TABLE IF NOT EXISTS sales_consultations (
  id BIGSERIAL PRIMARY KEY,
  consultation_number VARCHAR(40) NOT NULL UNIQUE,
  salesperson_name VARCHAR(160) NOT NULL,
  salesperson_email VARCHAR(320) NOT NULL,
  customer_name VARCHAR(160),
  business_name VARCHAR(200),
  customer_email VARCHAR(320),
  customer_phone VARCHAR(80),
  business_type VARCHAR(80),
  city VARCHAR(120),
  status VARCHAR(40) NOT NULL DEFAULT 'in_progress',
  current_card INTEGER NOT NULL DEFAULT 1,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  analysis JSONB,
  report_email_id VARCHAR(160),
  report_emailed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS sales_consultations_salesperson_email_idx
  ON sales_consultations (LOWER(salesperson_email));

CREATE INDEX IF NOT EXISTS sales_consultations_status_idx
  ON sales_consultations (status);

CREATE INDEX IF NOT EXISTS sales_consultations_created_at_idx
  ON sales_consultations (created_at DESC);
