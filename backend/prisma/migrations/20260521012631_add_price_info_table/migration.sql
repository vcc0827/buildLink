/*
  Warnings:

  - You are about to drop the column `account` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `bank` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `end_date` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `files` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `project_address` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `unit_address` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `unit_name` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `account` on the `reconciliation_units` table. All the data in the column will be lost.
  - You are about to drop the column `bank` on the `reconciliation_units` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `reconciliation_units` table. All the data in the column will be lost.
  - Added the required column `company_name` to the `reconciliation_units` table without a default value. This is not possible if the table is not empty.
  - Added the required column `project_name` to the `reconciliation_units` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `contracts` DROP FOREIGN KEY `contracts_customerId_fkey`;

-- AlterTable
ALTER TABLE `contracts` DROP COLUMN `account`,
    DROP COLUMN `amount`,
    DROP COLUMN `bank`,
    DROP COLUMN `customerId`,
    DROP COLUMN `end_date`,
    DROP COLUMN `files`,
    DROP COLUMN `phone`,
    DROP COLUMN `project_address`,
    DROP COLUMN `start_date`,
    DROP COLUMN `unit_address`,
    DROP COLUMN `unit_name`,
    ADD COLUMN `project_name` VARCHAR(200) NULL,
    ADD COLUMN `reconciliation_unit_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `reconciliation_units` DROP COLUMN `account`,
    DROP COLUMN `bank`,
    DROP COLUMN `name`,
    ADD COLUMN `bank_account` VARCHAR(50) NULL,
    ADD COLUMN `bank_code` VARCHAR(30) NULL,
    ADD COLUMN `bank_name` VARCHAR(100) NULL,
    ADD COLUMN `company_name` VARCHAR(200) NOT NULL,
    ADD COLUMN `project_name` VARCHAR(200) NOT NULL,
    ADD COLUMN `tax_number` VARCHAR(50) NULL;

-- CreateTable
CREATE TABLE `price_info` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `region` VARCHAR(50) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `model` VARCHAR(100) NOT NULL,
    `spec` VARCHAR(100) NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `tax_included_price` DECIMAL(15, 2) NOT NULL,
    `tax_excluded_price` DECIMAL(15, 2) NOT NULL,
    `month` VARCHAR(20) NOT NULL,
    `remark` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `price_info_region_month_idx`(`region`, `month`),
    INDEX `price_info_category_model_spec_idx`(`category`, `model`, `spec`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `contracts_reconciliation_unit_id_fkey` ON `contracts`(`reconciliation_unit_id`);

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_reconciliation_unit_id_fkey` FOREIGN KEY (`reconciliation_unit_id`) REFERENCES `reconciliation_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
