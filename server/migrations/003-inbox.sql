CREATE TABLE IF NOT EXISTS quote_followup (
  quote_id CHAR(36) PRIMARY KEY,
  revision INT UNSIGNED NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'nueva',
  assignee_id BIGINT UNSIGNED NULL,
  next_action VARCHAR(500) NOT NULL DEFAULT '',
  next_date VARCHAR(10) NOT NULL DEFAULT '',
  CONSTRAINT fk_followup_quote FOREIGN KEY (quote_id) REFERENCES quote_requests(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS quote_activity (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quote_id CHAR(36) NOT NULL,
  actor_id BIGINT UNSIGNED NOT NULL,
  actor_name VARCHAR(80) NOT NULL,
  created_at VARCHAR(30) NOT NULL,
  document LONGTEXT NOT NULL CHECK (JSON_VALID(document)),
  INDEX activity_quote (quote_id,id),
  CONSTRAINT fk_activity_quote FOREIGN KEY (quote_id) REFERENCES quote_requests(id)
) ENGINE=InnoDB;
