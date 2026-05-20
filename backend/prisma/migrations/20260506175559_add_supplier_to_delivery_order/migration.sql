/*
  Warnings:

  - Added the required column `supplierId` to the `delivery_orders` table without a default value. This is not possible if the table is not empty.

*/
-- 获取第一个供应商ID（如果没有供应商则使用customerId作为临时值）
SET @first_supplier_id = (SELECT MIN(id) FROM customers WHERE type = 'supplier');
SET @first_customer_id = (SELECT MIN(id) FROM customers);
SET @default_id = COALESCE(@first_supplier_id, @first_customer_id, 1);

-- AlterTable
ALTER TABLE `delivery_orders` ADD COLUMN `supplierId` INTEGER NULL;

-- 为现有数据设置默认值
UPDATE `delivery_orders` SET `supplierId` = @default_id WHERE `supplierId` IS NULL;

-- 然后修改为非空
ALTER TABLE `delivery_orders` MODIFY COLUMN `supplierId` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `delivery_orders_supplierId_fkey` ON `delivery_orders`(`supplierId`);

-- AddForeignKey
ALTER TABLE `delivery_orders` ADD CONSTRAINT `delivery_orders_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
