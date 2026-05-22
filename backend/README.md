# BuildLink 后端服务

## 项目概述

BuildLink是一个建筑材料供应链管理系统的后端服务，基于 NestJS + Prisma + MySQL 构建。

## 数据库表结构与字段类型说明

### 1. 客户表 (customers)

| 字段名 | 类型 | 说明 | 可选值 |
|--------|------|------|--------|
| type | String | 客户类型 | `supplier`(供应商), `project`(工地项目), `manufacturer`(生产商) |
| status | String | 状态 | `active`(启用), `inactive`(禁用) |

### 2. 产品表 (products)

| 字段名 | 类型 | 说明 | 可选值 |
|--------|------|------|--------|
| type | String | 产品类型 | `upstream`(上游), `downstream`(下游) |
| pricingType | String | 计价类型 | `fixed_price`(固定价格), `price_info`(信息价) |
| status | String | 状态 | `active`(启用), `inactive`(禁用) |

### 3. 合同表 (contracts)

| 字段名 | 类型 | 说明 | 可选值 |
|--------|------|------|--------|
| type | String | 合同类型 | `upstream`(上游合同), `downstream`(下游合同) |
| status | String | 状态 | `draft`(草稿), `active`(生效), `completed`(完成), `terminated`(终止) |

### 4. 送货单表 (delivery_orders)

| 字段名 | 类型 | 说明 | 可选值 |
|--------|------|------|--------|
| status | String | 状态 | `pending`(待确认), `confirmed`(已确认), `delivered`(已送达), `cancelled`(已取消) |

### 5. 库存表 (stock)

| 字段名 | 类型 | 说明 | 可选值 |
|--------|------|------|--------|
| type | String | 库存类型 | `in`(入库), `out`(出库) |
| status | String | 状态 | `pending`(待处理), `completed`(已完成), `cancelled`(已取消) |

### 6. 发票表 (invoices)

| 字段名 | 类型 | 说明 | 可选值 |
|--------|------|------|--------|
| type | String | 发票类型 | `purchase`(采购发票), `sale`(销售发票) |
| status | String | 状态 | `pending`(待审核), `approved`(已审核), `paid`(已付款), `rejected`(已拒绝) |

### 7. 付款表 (payments)

| 字段名 | 类型 | 说明 | 可选值 |
|--------|------|------|--------|
| type | String | 付款类型 | `payment`(付款), `receipt`(收款) |
| status | String | 状态 | `pending`(待审批), `approved`(已审批), `paid`(已支付), `rejected`(已拒绝) |

### 8. 对账单位表 (reconciliation_units)

| 字段名 | 类型 | 说明 | 可选值 |
|--------|------|------|--------|
| status | String | 状态 | `active`(启用), `inactive`(禁用) |

### 9. 信息价表 (price_info)

| 字段名 | 类型 | 说明 | 可选值 |
|--------|------|------|--------|
| region | String | 地区 | 自定义文本(如: 无锡, 上海, 苏州) |
| category | String | 产品大类 | 自定义文本(如: 砂浆, 加气块, 红砖) |
| model | String | 型号 | 自定义文本(如: 砌筑砂浆, 砂加气, 抹灰砂浆) |
| spec | String | 规格 | 自定义文本(如: dmm5.0, 600*200*100) |

## 启动方式

### 开发环境

```bash
# 安装依赖
npm install

# 运行数据库迁移
npx prisma migrate dev

# 启动开发服务器
npm run dev
```

### 生产环境

```bash
# 构建项目
npm run build

# 启动生产服务器
npm run start:prod
```

## API 文档

启动服务后访问: http://localhost:4000/api

## 目录结构

```
backend/
├── src/
│   ├── modules/          # 业务模块
│   │   ├── contract/     # 合同管理
│   │   ├── delivery/     # 送货单管理
│   │   ├── invoice/      # 发票管理
│   │   ├── price-info/   # 信息价管理
│   │   └── ...           # 其他模块
│   ├── prisma/           # Prisma 配置
│   ├── utils/            # 工具函数
│   └── app.module.ts     # 主应用模块
├── scripts/              # 数据导入脚本
├── .env                  # 环境变量配置
└── package.json          # 项目依赖
```

## 环境变量配置

在 `.env` 文件中配置以下变量：

```env
DATABASE_URL="mysql://username:password@localhost:3306/buildlink"
PORT=4000
JWT_SECRET="your-jwt-secret"
```

## 数据导入脚本

位于 `scripts/` 目录下：

| 脚本名称 | 功能 |
|----------|------|
| `import-data.ts` | 导入基础数据 |
| `import-product-data.ts` | 导入产品数据 |
| `import-price-info.js` | 导入信息价数据 |
| `reimport-customers.ts` | 重新导入客户数据 |
| `reimport-manufacturers.ts` | 重新导入生产商数据 |

运行方式：
```bash
npx ts-node scripts/import-product-data.ts
```
