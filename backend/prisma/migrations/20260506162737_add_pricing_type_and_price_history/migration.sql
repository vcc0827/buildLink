-- AlterTable
ALTER TABLE `products` ADD COLUMN `pricing_type` VARCHAR(20) NOT NULL DEFAULT 'fixed_price';

-- CreateTable
CREATE TABLE `product_price_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `price` DECIMAL(15, 2) NOT NULL,
    `effective_date` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `product_price_history_productId_fkey`(`productId`),
    INDEX `product_price_history_product_effective`(`productId`, `effective_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `product_price_history` ADD CONSTRAINT `product_price_history_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
