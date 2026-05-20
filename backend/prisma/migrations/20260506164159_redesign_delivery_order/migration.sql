/*
  Warnings:

  - You are about to drop the column `type` on the `delivery_orders` table. All the data in the column will be lost.
  - You are about to drop the `delivery_items` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `productType` to the `delivery_orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `delivery_items` DROP FOREIGN KEY `delivery_items_delivery_order_id_fkey`;

-- AlterTable
ALTER TABLE `delivery_orders` DROP COLUMN `type`,
    ADD COLUMN `productType` VARCHAR(20) NOT NULL;

-- DropTable
DROP TABLE `delivery_items`;

-- CreateTable
CREATE TABLE `delivery_order_mortar` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `delivery_order_id` INTEGER NOT NULL,
    `product_id` INTEGER NULL,
    `quantity` DECIMAL(15, 4) NOT NULL,
    `price` DECIMAL(15, 4) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `mortar_grade` VARCHAR(50) NOT NULL,
    `packing_type` VARCHAR(20) NOT NULL,
    `license_plate` VARCHAR(20) NOT NULL,

    INDEX `delivery_order_mortar_delivery_order_id_fkey`(`delivery_order_id`),
    INDEX `delivery_order_mortar_product_id_fkey`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `delivery_order_block` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `delivery_order_id` INTEGER NOT NULL,
    `product_id` INTEGER NULL,
    `quantity` DECIMAL(15, 4) NOT NULL,
    `converted_cubic` DECIMAL(15, 4) NOT NULL,
    `price` DECIMAL(15, 4) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `frame_taken` INTEGER NOT NULL,
    `frame_returned` INTEGER NOT NULL,
    `remarks` TEXT NULL,

    INDEX `delivery_order_block_delivery_order_id_fkey`(`delivery_order_id`),
    INDEX `delivery_order_block_product_id_fkey`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `delivery_order_mortar` ADD CONSTRAINT `delivery_order_mortar_delivery_order_id_fkey` FOREIGN KEY (`delivery_order_id`) REFERENCES `delivery_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_order_mortar` ADD CONSTRAINT `delivery_order_mortar_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_order_block` ADD CONSTRAINT `delivery_order_block_delivery_order_id_fkey` FOREIGN KEY (`delivery_order_id`) REFERENCES `delivery_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_order_block` ADD CONSTRAINT `delivery_order_block_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
