-- AlterTable
ALTER TABLE `contracts` ADD COLUMN `account` VARCHAR(50) NULL,
    ADD COLUMN `bank` VARCHAR(100) NULL,
    ADD COLUMN `phone` VARCHAR(20) NULL,
    ADD COLUMN `project_address` VARCHAR(255) NULL,
    ADD COLUMN `unit_address` VARCHAR(255) NULL,
    ADD COLUMN `unit_name` VARCHAR(200) NULL;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `model` VARCHAR(100) NULL,
    `spec` VARCHAR(100) NULL,
    `price` DECIMAL(15, 2) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `remark` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contract_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contractId` INTEGER NOT NULL,
    `productId` INTEGER NULL,
    `product_name` VARCHAR(100) NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `model` VARCHAR(100) NULL,
    `spec` VARCHAR(100) NULL,
    `price` DECIMAL(15, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `contract_items_contractId_fkey`(`contractId`),
    INDEX `contract_items_productId_fkey`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `contract_items` ADD CONSTRAINT `contract_items_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contract_items` ADD CONSTRAINT `contract_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
