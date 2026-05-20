/*
  Warnings:

  - You are about to drop the column `account` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `bank` on the `customers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `customers` DROP COLUMN `account`,
    DROP COLUMN `bank`,
    ADD COLUMN `reconciliation_unit_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `reconciliation_units` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `contact` VARCHAR(50) NULL,
    `phone` VARCHAR(20) NULL,
    `address` VARCHAR(255) NULL,
    `bank` VARCHAR(100) NULL,
    `account` VARCHAR(50) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `remark` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_reconciliation_unit_id_fkey` FOREIGN KEY (`reconciliation_unit_id`) REFERENCES `reconciliation_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
