ALTER TABLE staff_users MODIFY role ENUM('owner','editor','sales','admin') NOT NULL;
UPDATE staff_users SET role='admin' WHERE role='owner';
UPDATE staff_users SET role='editor' WHERE role='sales';
ALTER TABLE staff_users MODIFY role ENUM('admin','editor') NOT NULL;
CREATE TABLE IF NOT EXISTS staff_access_audit (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 actor_id INT UNSIGNED NOT NULL,
 target_id INT UNSIGNED NOT NULL,
 action VARCHAR(20) NOT NULL,
 document JSON NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (actor_id) REFERENCES staff_users(id),
 FOREIGN KEY (target_id) REFERENCES staff_users(id)
) ENGINE=InnoDB;
