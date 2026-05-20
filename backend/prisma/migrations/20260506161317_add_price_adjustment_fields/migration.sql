-- AlterTable: 添加可空字段
ALTER TABLE `contract_items` 
    ADD COLUMN `base_price` DECIMAL(15, 2) NULL,
    ADD COLUMN `adjustment_type` VARCHAR(20) NULL,
    ADD COLUMN `adjustment_value` DECIMAL(15, 4) NULL;

-- 更新现有数据
UPDATE `contract_items` 
    SET `base_price` = `price`,
        `adjustment_type` = 'fixed',
        `adjustment_value` = `price`;

-- 将字段改为非空
ALTER TABLE `contract_items` 
    MODIFY COLUMN `base_price` DECIMAL(15, 2) NOT NULL,
    MODIFY COLUMN `adjustment_type` VARCHAR(20) NOT NULL,
    MODIFY COLUMN `adjustment_value` DECIMAL(15, 4) NOT NULL;