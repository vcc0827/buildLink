-- AlterTable
ALTER TABLE `delivery_orders` ADD COLUMN `deleted_at` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `stock_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `no` VARCHAR(50) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `month` VARCHAR(20) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `buyer_id` INTEGER NOT NULL,
    `seller_id` INTEGER NOT NULL,
    `product_id` INTEGER NULL,
    `model` VARCHAR(100) NULL,
    `unit` VARCHAR(20) NOT NULL,
    `quantity` DECIMAL(15, 4) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `unit_price` DECIMAL(15, 4) NOT NULL,
    `tax_rate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `tax_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(15, 2) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `remark` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `stock_records_no_key`(`no`),
    INDEX `stock_records_buyer_id_fkey`(`buyer_id`),
    INDEX `stock_records_seller_id_fkey`(`seller_id`),
    INDEX `stock_records_product_id_fkey`(`product_id`),
    INDEX `stock_records_month_idx`(`month`),
    INDEX `stock_records_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `stock_records` ADD CONSTRAINT `stock_records_buyer_id_fkey` FOREIGN KEY (`buyer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_records` ADD CONSTRAINT `stock_records_seller_id_fkey` FOREIGN KEY (`seller_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_records` ADD CONSTRAINT `stock_records_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
