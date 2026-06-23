-- CreateTable
CREATE TABLE `user_roles` (
    `code` VARCHAR(30) NOT NULL,
    `label` VARCHAR(80) NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `genders` (
    `code` VARCHAR(20) NOT NULL,
    `label` VARCHAR(80) NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prescription_statuses` (
    `code` VARCHAR(30) NOT NULL,
    `label` VARCHAR(80) NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medicine_frequencies` (
    `code` VARCHAR(30) NOT NULL,
    `label` VARCHAR(80) NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medicine_timings` (
    `code` VARCHAR(30) NOT NULL,
    `label` VARCHAR(80) NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dispense_statuses` (
    `code` VARCHAR(30) NOT NULL,
    `label` VARCHAR(80) NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alert_types` (
    `code` VARCHAR(30) NOT NULL,
    `label` VARCHAR(80) NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_types` (
    `code` VARCHAR(30) NOT NULL,
    `label` VARCHAR(80) NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(30) NOT NULL,
    `phone` VARCHAR(15) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `profile_photo` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `last_login` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_otps` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `otp_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctors` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `license_number` VARCHAR(50) NOT NULL,
    `specialization` VARCHAR(100) NOT NULL,
    `hospital_name` VARCHAR(150) NOT NULL,
    `hospital_address` VARCHAR(191) NOT NULL,
    `city` VARCHAR(80) NOT NULL,
    `pincode` VARCHAR(10) NOT NULL,
    `is_approved` BOOLEAN NOT NULL DEFAULT false,
    `approved_at` DATETIME(3) NULL,

    UNIQUE INDEX `doctors_user_id_key`(`user_id`),
    UNIQUE INDEX `doctors_license_number_key`(`license_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patients` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `date_of_birth` DATE NOT NULL,
    `gender` VARCHAR(20) NOT NULL,
    `blood_group` VARCHAR(5) NULL,
    `address` VARCHAR(191) NOT NULL,
    `city` VARCHAR(80) NOT NULL,
    `pincode` VARCHAR(10) NOT NULL,
    `aadhar_number` VARCHAR(20) NULL,
    `emergency_contact` VARCHAR(15) NULL,

    UNIQUE INDEX `patients_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pharmacies` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `owner_name` VARCHAR(100) NOT NULL,
    `license_number` VARCHAR(50) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `city` VARCHAR(80) NOT NULL,
    `pincode` VARCHAR(10) NOT NULL,
    `latitude` DECIMAL(10, 7) NOT NULL,
    `longitude` DECIMAL(10, 7) NOT NULL,
    `phone` VARCHAR(15) NOT NULL,
    `email` VARCHAR(150) NULL,
    `opening_time` TIME(0) NULL,
    `closing_time` TIME(0) NULL,
    `is_approved` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `pharmacies_license_number_key`(`license_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pharmacists` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `pharmacy_id` CHAR(36) NOT NULL,
    `license_number` VARCHAR(50) NOT NULL,
    `is_approved` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `pharmacists_user_id_key`(`user_id`),
    UNIQUE INDEX `pharmacists_license_number_key`(`license_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prescriptions` (
    `id` CHAR(36) NOT NULL,
    `doctor_id` CHAR(36) NOT NULL,
    `patient_id` CHAR(36) NOT NULL,
    `qr_code` LONGTEXT NOT NULL,
    `qr_code_token` VARCHAR(100) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'active',
    `issued_date` DATE NOT NULL,
    `expiry_date` DATE NOT NULL,
    `notes` VARCHAR(191) NULL,
    `follow_up_date` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `prescriptions_qr_code_token_key`(`qr_code_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prescription_items` (
    `id` CHAR(36) NOT NULL,
    `prescription_id` CHAR(36) NOT NULL,
    `medicine_id` CHAR(36) NULL,
    `medicine_name` VARCHAR(150) NOT NULL,
    `dosage` VARCHAR(50) NOT NULL,
    `frequency` VARCHAR(30) NOT NULL,
    `duration_days` INTEGER NOT NULL,
    `timing` VARCHAR(30) NULL,
    `quantity_to_take` VARCHAR(50) NULL,
    `instructions` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medicines` (
    `id` CHAR(36) NOT NULL,
    `brand_name` VARCHAR(150) NOT NULL,
    `generic_name` VARCHAR(150) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `manufacturer` VARCHAR(150) NULL,
    `dosage_forms` VARCHAR(100) NOT NULL,
    `standard_strength` VARCHAR(100) NULL,
    `requires_prescription` BOOLEAN NOT NULL DEFAULT true,
    `description` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pharmacy_inventory` (
    `id` CHAR(36) NOT NULL,
    `pharmacy_id` CHAR(36) NOT NULL,
    `medicine_id` CHAR(36) NOT NULL,
    `medicine_name` VARCHAR(150) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `batch_number` VARCHAR(50) NULL,
    `unit_price` DECIMAL(8, 2) NULL,
    `expiry_date` DATE NULL,
    `reorder_level` INTEGER NOT NULL DEFAULT 10,
    `last_updated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_by` CHAR(36) NULL,

    UNIQUE INDEX `pharmacy_inventory_pharmacy_id_medicine_id_batch_number_key`(`pharmacy_id`, `medicine_id`, `batch_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dispensed_records` (
    `id` CHAR(36) NOT NULL,
    `prescription_id` CHAR(36) NOT NULL,
    `pharmacy_id` CHAR(36) NOT NULL,
    `pharmacist_id` CHAR(36) NOT NULL,
    `dispensed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(30) NOT NULL DEFAULT 'completed',
    `notes` VARCHAR(191) NULL,
    `partial_reason` VARCHAR(191) NULL,

    UNIQUE INDEX `dispensed_records_prescription_id_key`(`prescription_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refill_alerts` (
    `id` CHAR(36) NOT NULL,
    `prescription_id` CHAR(36) NOT NULL,
    `patient_id` CHAR(36) NOT NULL,
    `doctor_id` CHAR(36) NOT NULL,
    `alert_type` VARCHAR(30) NOT NULL,
    `alert_date` DATE NOT NULL,
    `is_sent` BOOLEAN NOT NULL DEFAULT false,
    `sent_at` DATETIME(3) NULL,
    `is_acknowledged` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `read_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` CHAR(36) NULL,
    `ip_address` VARCHAR(45) NULL,
    `description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_fkey` FOREIGN KEY (`role`) REFERENCES `user_roles`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_reset_otps` ADD CONSTRAINT `password_reset_otps_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctors` ADD CONSTRAINT `doctors_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patients` ADD CONSTRAINT `patients_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patients` ADD CONSTRAINT `patients_gender_fkey` FOREIGN KEY (`gender`) REFERENCES `genders`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pharmacists` ADD CONSTRAINT `pharmacists_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pharmacists` ADD CONSTRAINT `pharmacists_pharmacy_id_fkey` FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_status_fkey` FOREIGN KEY (`status`) REFERENCES `prescription_statuses`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescription_items` ADD CONSTRAINT `prescription_items_prescription_id_fkey` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescription_items` ADD CONSTRAINT `prescription_items_medicine_id_fkey` FOREIGN KEY (`medicine_id`) REFERENCES `medicines`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescription_items` ADD CONSTRAINT `prescription_items_frequency_fkey` FOREIGN KEY (`frequency`) REFERENCES `medicine_frequencies`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescription_items` ADD CONSTRAINT `prescription_items_timing_fkey` FOREIGN KEY (`timing`) REFERENCES `medicine_timings`(`code`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pharmacy_inventory` ADD CONSTRAINT `pharmacy_inventory_pharmacy_id_fkey` FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pharmacy_inventory` ADD CONSTRAINT `pharmacy_inventory_medicine_id_fkey` FOREIGN KEY (`medicine_id`) REFERENCES `medicines`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pharmacy_inventory` ADD CONSTRAINT `pharmacy_inventory_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dispensed_records` ADD CONSTRAINT `dispensed_records_prescription_id_fkey` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dispensed_records` ADD CONSTRAINT `dispensed_records_pharmacy_id_fkey` FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dispensed_records` ADD CONSTRAINT `dispensed_records_pharmacist_id_fkey` FOREIGN KEY (`pharmacist_id`) REFERENCES `pharmacists`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dispensed_records` ADD CONSTRAINT `dispensed_records_status_fkey` FOREIGN KEY (`status`) REFERENCES `dispense_statuses`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refill_alerts` ADD CONSTRAINT `refill_alerts_prescription_id_fkey` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refill_alerts` ADD CONSTRAINT `refill_alerts_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refill_alerts` ADD CONSTRAINT `refill_alerts_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refill_alerts` ADD CONSTRAINT `refill_alerts_alert_type_fkey` FOREIGN KEY (`alert_type`) REFERENCES `alert_types`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_type_fkey` FOREIGN KEY (`type`) REFERENCES `notification_types`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
