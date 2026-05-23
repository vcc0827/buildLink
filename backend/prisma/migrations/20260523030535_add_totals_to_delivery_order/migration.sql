-- AlterTable
ALTER TABLE `delivery_orders` ADD COLUMN `purchase_total` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `sales_total` DECIMAL(15, 2) NOT NULL DEFAULT 0;
