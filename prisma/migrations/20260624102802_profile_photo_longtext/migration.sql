-- AlterTable
ALTER TABLE `prescriptions` ADD COLUMN `disease` VARCHAR(150) NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `profile_photo` LONGTEXT NULL;
