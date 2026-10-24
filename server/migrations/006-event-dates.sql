CREATE TABLE IF NOT EXISTS service_event_dates (
 event_id CHAR(36) NOT NULL,
 service_date DATE NOT NULL,
 PRIMARY KEY(event_id, service_date),
 INDEX service_dates(service_date),
 FOREIGN KEY(event_id) REFERENCES service_events(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO service_event_dates (event_id, service_date)
SELECT id, event_date FROM service_events;
