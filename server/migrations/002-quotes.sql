CREATE TABLE IF NOT EXISTS quote_requests (
  id CHAR(36) PRIMARY KEY,
  folio VARCHAR(48) NOT NULL UNIQUE,
  idempotency_key CHAR(36) NOT NULL UNIQUE,
  payload_hash CHAR(64) NOT NULL,
  estimate_snapshot LONGTEXT NOT NULL CHECK (JSON_VALID(estimate_snapshot)),
  contact_document LONGTEXT NOT NULL CHECK (JSON_VALID(contact_document)),
  consent_version VARCHAR(40) NOT NULL,
  created_at VARCHAR(30) NOT NULL,
  sales_status VARCHAR(30) NOT NULL DEFAULT 'nueva'
) ENGINE=InnoDB;
