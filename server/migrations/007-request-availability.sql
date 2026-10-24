ALTER TABLE quote_followup
 ADD COLUMN IF NOT EXISTS availability_status VARCHAR(16) NOT NULL DEFAULT 'pending',
 ADD COLUMN IF NOT EXISTS availability_document LONGTEXT NULL CHECK(availability_document IS NULL OR JSON_VALID(availability_document)),
 ADD COLUMN IF NOT EXISTS tracking_hash CHAR(64) NULL;
CREATE UNIQUE INDEX IF NOT EXISTS tracking_hash ON quote_followup(tracking_hash);
ALTER TABLE editorial_state ADD COLUMN IF NOT EXISTS response_hours INT UNSIGNED NOT NULL DEFAULT 24;
