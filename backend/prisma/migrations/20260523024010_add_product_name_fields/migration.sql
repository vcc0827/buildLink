-- AlterTable
ALTER TABLE `delivery_order_block` ADD COLUMN `product_name` VARCHAR(200) NULL,
    ADD COLUMN `spec` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `delivery_order_mortar` ADD COLUMN `product_name` VARCHAR(200) NULL;
