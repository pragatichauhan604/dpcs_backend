CREATE TABLE `appointment_statuses` (
  `code` VARCHAR(30) NOT NULL,
  `label` VARCHAR(80) NOT NULL,

  PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `appointment_statuses` (`code`, `label`) VALUES
  ('requested', 'Requested'),
  ('scheduled', 'Scheduled'),
  ('cancelled', 'Cancelled'),
  ('completed', 'Completed');

CREATE TABLE `appointments` (
  `id` CHAR(36) NOT NULL,
  `patient_id` CHAR(36) NOT NULL,
  `doctor_id` CHAR(36) NOT NULL,
  `requested_date` DATETIME(3) NOT NULL,
  `reason` VARCHAR(300) NOT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'requested',
  `scheduled_at` DATETIME(3) NULL,
  `doctor_note` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `appointments_patient_id_idx` (`patient_id`),
  INDEX `appointments_doctor_id_idx` (`doctor_id`),
  INDEX `appointments_status_idx` (`status`),
  CONSTRAINT `appointments_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `appointments_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `appointments_status_fkey` FOREIGN KEY (`status`) REFERENCES `appointment_statuses`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
