CREATE TABLE `refill_request_statuses` (
  `code` VARCHAR(30) NOT NULL,
  `label` VARCHAR(80) NOT NULL,
  PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `refill_request_statuses` (`code`, `label`) VALUES
  ('requested', 'Requested'),
  ('approved', 'Approved'),
  ('rejected', 'Rejected');

ALTER TABLE `refill_alerts`
  ADD COLUMN `status` VARCHAR(30) NOT NULL DEFAULT 'requested',
  ADD COLUMN `doctor_note` TEXT NULL,
  ADD COLUMN `responded_at` DATETIME(3) NULL;

CREATE INDEX `refill_alerts_doctor_id_status_idx` ON `refill_alerts` (`doctor_id`, `status`);
CREATE INDEX `refill_alerts_status_idx` ON `refill_alerts` (`status`);

ALTER TABLE `refill_alerts`
  ADD CONSTRAINT `refill_alerts_status_fkey`
  FOREIGN KEY (`status`) REFERENCES `refill_request_statuses` (`code`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
