CREATE TABLE IF NOT EXISTS service_events (
 id CHAR(36) PRIMARY KEY,
 quote_id CHAR(36) NULL UNIQUE,
 folio VARCHAR(48) NOT NULL,
 revision INT UNSIGNED NOT NULL DEFAULT 0,
 event_date DATE NOT NULL,
 status VARCHAR(20) NOT NULL,
 hold_until VARCHAR(30) NOT NULL DEFAULT '',
 document LONGTEXT NOT NULL CHECK(JSON_VALID(document)),
 proposal_version INT UNSIGNED NOT NULL DEFAULT 0,
 published LONGTEXT NULL CHECK(published IS NULL OR JSON_VALID(published)),
 tracking_hash CHAR(64) NULL UNIQUE,
 updated_at VARCHAR(30) NOT NULL,
 INDEX events_date(event_date,status),
 FOREIGN KEY(quote_id) REFERENCES quote_requests(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS event_activity (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 event_id CHAR(36) NOT NULL,
 actor_id INT UNSIGNED NOT NULL,
 actor_name VARCHAR(80) NOT NULL,
 action VARCHAR(30) NOT NULL,
 document LONGTEXT NOT NULL CHECK(JSON_VALID(document)),
 created_at VARCHAR(30) NOT NULL,
 FOREIGN KEY(event_id) REFERENCES service_events(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS event_proposals (
 event_id CHAR(36) NOT NULL,
 version INT UNSIGNED NOT NULL,
 document LONGTEXT NOT NULL CHECK(JSON_VALID(document)),
 created_at VARCHAR(30) NOT NULL,
 PRIMARY KEY(event_id,version),
 FOREIGN KEY(event_id) REFERENCES service_events(id)
) ENGINE=InnoDB;
