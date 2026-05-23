/*
  Warnings:

  - You are about to drop the column `contractId` on the `delivery_orders` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `delivery_orders` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_date` on the `delivery_orders` table. All the data in the column will be lost.
  - You are about to drop the column `productType` on the `delivery_orders` table. All the data in the column will be lost.
  - You are about to drop the column `receipt_url` on the `delivery_orders` table. All the data in the column will be lost.
  - You are about to drop the column `supplierId` on the `delivery_orders` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `delivery_orders` table. All the data in the column will be lost.
  - You are about to drop the `delivery_order_block` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `delivery_order_mortar` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `date` to the `delivery_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `project_id` to the `delivery_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplier_id` to the `delivery_orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `delivery_order_block` DROP FOREIGN KEY `delivery_order_block_delivery_order_id_fkey`;

-- DropForeignKey
ALTER TABLE `delivery_order_block` DROP FOREIGN KEY `delivery_order_block_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `delivery_order_mortar` DROP FOREIGN KEY `delivery_order_mortar_delivery_order_id_fkey`;

-- DropForeignKey
ALTER TABLE `delivery_order_mortar` DROP FOREIGN KEY `delivery_order_mortar_product_id_fkey`;

-- DropForeignKey
ALTER TABLE `delivery_orders` DROP FOREIGN KEY `delivery_orders_contractId_fkey`;

-- DropForeignKey
ALTER TABLE `delivery_orders` DROP FOREIGN KEY `delivery_orders_customerId_fkey`;

-- DropForeignKey
ALTER TABLE `delivery_orders` DROP FOREIGN KEY `delivery_orders_supplierId_fkey`;

-- AlterTable
ALTER TABLE `delivery_orders` DROP COLUMN `contractId`,
    DROP COLUMN `customerId`,
    DROP COLUMN `delivery_date`,
    DROP COLUMN `productType`,
    DROP COLUMN `receipt_url`,
    DROP COLUMN `supplierId`,
    DROP COLUMN `totalAmount`,
    ADD COLUMN `contract_belong` VARCHAR(200) NULL,
    ADD COLUMN `date` DATE NOT NULL,
    ADD COLUMN `driver` VARCHAR(50) NULL,
    ADD COLUMN `project_id` INTEGER NOT NULL,
    ADD COLUMN `region` VARCHAR(100) NULL,
    ADD COLUMN `salesman` VARCHAR(50) NULL,
    ADD COLUMN `supplier_id` INTEGER NOT NULL;

-- DropTable
DROP TABLE `delivery_order_block`;

-- DropTable
DROP TABLE `delivery_order_mortar`;

-- CreateTable
CREATE TABLE `delivery_order_item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `delivery_order_id` INTEGER NOT NULL,
    `product_name` VARCHAR(200) NOT NULL,
    `spec` VARCHAR(100) NULL,
    `mortar_tonnage` DECIMAL(15, 4) NULL,
    `packing_type` VARCHAR(20) NULL,
    `block_quantity` DECIMAL(15, 4) NULL,
    `received_quantity` DECIMAL(15, 4) NULL,
    `cubic_meter` DECIMAL(15, 4) NULL,
    `purchase_unit_price` DECIMAL(15, 4) NOT NULL,
    `purchase_amount` DECIMAL(15, 2) NOT NULL,
    `sales_unit_price` DECIMAL(15, 4) NOT NULL,
    `sales_amount` DECIMAL(15, 2) NOT NULL,
    `frame_taken` INTEGER NOT NULL DEFAULT 0,
    `frame_returned` INTEGER NOT NULL DEFAULT 0,
    `remark` TEXT NULL,

    INDEX `delivery_order_item_delivery_order_id_fkey`(`delivery_order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `delivery_orders_project_id_fkey` ON `delivery_orders`(`project_id`);

-- CreateIndex
CREATE INDEX `delivery_orders_supplier_id_fkey` ON `delivery_orders`(`supplier_id`);

-- AddForeignKey
ALTER TABLE `delivery_orders` ADD CONSTRAINT `delivery_orders_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_orders` ADD CONSTRAINT `delivery_orders_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_order_item` ADD CONSTRAINT `delivery_order_item_delivery_order_id_fkey` FOREIGN KEY (`delivery_order_id`) REFERENCES `delivery_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
