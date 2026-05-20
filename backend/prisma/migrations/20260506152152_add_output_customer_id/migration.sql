-- AlterTable
ALTER TABLE `invoices` ADD COLUMN `output_customer_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `invoices_output_customerId_idx` ON `invoices`(`output_customer_id`);

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_output_customer_id_fkey` FOREIGN KEY (`output_customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `invoices` RENAME INDEX `invoices_output_customerId_fkey` TO `invoices_input_customerId_fkey`;
