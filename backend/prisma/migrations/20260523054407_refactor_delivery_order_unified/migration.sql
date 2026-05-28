/*
  Warnings:

  - You are about to drop the column `contract_belong` on the `delivery_orders` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `delivery_orders` table. All the data in the column will be lost.
  - You are about to drop the column `driver` on the `delivery_orders` table. All the data in the column will be lost.
  - You are about to drop the column `project_id` on the `delivery_orders` table. All the data in the column will be lost.
  - You are about to drop the column `purchase_total` on the `delivery_orders` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `delivery_orders` table. All the data in the column will be lost.
  - You are about to drop the column `sales_total` on the `delivery_orders` table. All the data in the column will be lost.
  - You are about to drop the column `salesman` on the `delivery_orders` table. All the data in the column will be lost.
  - You are about to drop the column `supplier_id` on the `delivery_orders` table. All the data in the column will be lost.
  - You are about to drop the `delivery_order_item` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category_code` to the `delivery_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `delivery_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `delivery_date` to the `delivery_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplierId` to the `delivery_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `delivery_orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `delivery_order_item` DROP FOREIGN KEY `delivery_order_item_delivery_order_id_fkey`;

-- DropForeignKey
ALTER TABLE `delivery_orders` DROP FOREIGN KEY `delivery_orders_project_id_fkey`;

-- DropForeignKey
ALTER TABLE `delivery_orders` DROP FOREIGN KEY `delivery_orders_supplier_id_fkey`;

-- AlterTable
ALTER TABLE `delivery_orders` DROP COLUMN `contract_belong`,
    DROP COLUMN `date`,
    DROP COLUMN `driver`,
    DROP COLUMN `project_id`,
    DROP COLUMN `purchase_total`,
    DROP COLUMN `region`,
    DROP COLUMN `sales_total`,
    DROP COLUMN `salesman`,
    DROP COLUMN `supplier_id`,
    ADD COLUMN `category_code` VARCHAR(50) NOT NULL,
    ADD COLUMN `contractId` INTEGER NULL,
    ADD COLUMN `customerId` INTEGER NOT NULL,
    ADD COLUMN `delivery_date` DATETIME(3) NOT NULL,
    ADD COLUMN `receipt_url` VARCHAR(255) NULL,
    ADD COLUMN `supplierId` INTEGER NOT NULL,
    ADD COLUMN `totalAmount` DECIMAL(15, 2) NOT NULL;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `category_code` VARCHAR(50) NULL,
    ADD COLUMN `category_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `stock_records` ADD COLUMN `category_code` VARCHAR(50) NULL;

-- DropTable
DROP TABLE `delivery_order_item`;

-- CreateTable
CREATE TABLE `product_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `fields` JSON NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `sort` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `product_categories_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `delivery_order_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `delivery_order_id` INTEGER NOT NULL,
    `product_id` INTEGER NULL,
    `quantity` DECIMAL(15, 4) NOT NULL,
    `price` DECIMAL(15, 4) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `attributes` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `delivery_order_items_delivery_order_id_fkey`(`delivery_order_id`),
    INDEX `delivery_order_items_product_id_fkey`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `delivery_orders_contractId_fkey` ON `delivery_orders`(`contractId`);

-- CreateIndex
CREATE INDEX `delivery_orders_supplierId_fkey` ON `delivery_orders`(`supplierId`);

-- CreateIndex
CREATE INDEX `delivery_orders_customerId_fkey` ON `delivery_orders`(`customerId`);

-- CreateIndex
CREATE INDEX `delivery_orders_category_code_idx` ON `delivery_orders`(`category_code`);

-- CreateIndex
CREATE INDEX `products_category_id_fkey` ON `products`(`category_id`);

-- CreateIndex
CREATE INDEX `products_category_code_idx` ON `products`(`category_code`);

-- CreateIndex
CREATE INDEX `stock_records_category_code_idx` ON `stock_records`(`category_code`);

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `product_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_orders` ADD CONSTRAINT `delivery_orders_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_orders` ADD CONSTRAINT `delivery_orders_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_orders` ADD CONSTRAINT `delivery_orders_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_order_items` ADD CONSTRAINT `delivery_order_items_delivery_order_id_fkey` FOREIGN KEY (`delivery_order_id`) REFERENCES `delivery_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_order_items` ADD CONSTRAINT `delivery_order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
