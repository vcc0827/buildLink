# 建材供销对账管理系统 (BuildLink)

建材行业供销商专属上下游对账 + 多角色财务一体化管理平台

## 技术栈

### 前端
- Vue 3 + Vite + TypeScript
- Element Plus
- Pinia (状态管理)
- Vue Router
- Axios

### 后端
- NestJS + TypeScript
- Prisma ORM
- MySQL 8.4
- JWT 认证

## 测试账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | 123456 | 管理员 | 系统管理员，拥有所有权限 |
| finance | 123456 | 财务 | 财务人员，可管理发票、收付款、核销 |
| sales | 123456 | 业务员 | 业务员，可管理客户、合同、发货单 |

## 快速启动

### 1. 安装依赖

```bash
# 前端
cd frontend
npm install

# 后端
cd backend
npm install
```

### 2. 配置数据库

确保 MySQL 8.4 已启动，并创建数据库：

```sql
CREATE DATABASE buildlink;
```

配置 `.env` 文件（backend目录下）：

```env
DATABASE_URL="mysql://root:password@localhost:3306/buildlink"
JWT_SECRET="buildlink-secret-key-2024"
```

### 3. 初始化数据库

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 4. 启动服务

```bash
# 前端 (端口 3000)
cd frontend
npm run dev

# 后端 (端口 4000)
cd backend
npm run dev
```

## 功能模块

### 业务模块
- 厂家管理（供应商信息管理）
- 项目管理（工地项目信息）
- 对账单位管理（下游客户信息）
- 产品管理（商品品类管理）
- 合同管理
- 送货单管理
- 上游对账
- 下游对账

### 财务模块
- 库存管理（入库/出库）
- 发票管理（进项票、销项票）
- 收付款管理
- 往来核销
- 数据报表

---

## 数据库表结构

### 核心表说明

| 表名 | 说明 | 核心字段 |
|------|------|----------|
| `users` | 用户表 | id, username, password, role, status |
| `customers` | 客户表（厂家/项目） | id, name, type(supplier/manufacturer/project), category, contact, phone, reconciliationUnitId |
| `reconciliation_units` | 对账单位表 | id, companyName, projectName, taxNumber, address, phone, contact, bankName, bankAccount, bankCode |
| `products` | 产品表 | id, name, category, spec, unit, price |
| `contracts` | 合同表 | id, customerId, productId, unitPrice, quantity, amount, startDate, endDate |
| `delivery_orders` | 送货单表 | id, supplierId, customerId, productId, quantity, price, amount, deliveryDate |
| `stock_records` | 库存记录表 | id, productId, type(in/out), quantity, price, amount, buyerId, sellerId, invoiceNo |
| `invoices` | 发票表 | id, type(in/out), invoiceNo, invoiceDate, amount, taxAmount, totalAmount, customerId |
| `payments` | 收付款表 | id, type(income/expense), amount, paymentDate, customerId, invoiceId |
| `statements` | 对账单表 | id, customerId, period, totalAmount, status |

### 数据关系

```
ReconciliationUnit 1:N Customer(project)
Customer 1:N DeliveryOrder
Customer 1:N Contract
Product 1:N DeliveryOrder
Product 1:N Contract
Product 1:N StockRecord
Customer 1:N Invoice
Customer 1:N Payment
```

---

## 后端 API 接口

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/login` | 用户登录 |
| POST | `/auth/logout` | 用户登出 |
| GET | `/auth/profile` | 获取用户信息 |

### 用户管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/users` | 查询用户列表 |
| GET | `/users/:id` | 获取用户详情 |
| POST | `/users` | 创建用户 |
| PUT | `/users/:id` | 更新用户 |
| DELETE | `/users/:id` | 删除用户 |

### 客户管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/customers` | 查询客户列表 |
| GET | `/customers/:id` | 获取客户详情 |
| POST | `/customers` | 创建客户 |
| PUT | `/customers/:id` | 更新客户 |
| DELETE | `/customers/:id` | 删除客户 |

### 对账单位

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/reconciliation-units` | 查询对账单位列表 |
| GET | `/reconciliation-units/:id` | 获取对账单位详情 |
| POST | `/reconciliation-units` | 创建对账单位 |
| PUT | `/reconciliation-units/:id` | 更新对账单位 |
| DELETE | `/reconciliation-units/:id` | 删除对账单位 |

### 产品管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/products` | 查询产品列表 |
| GET | `/products/:id` | 获取产品详情 |
| POST | `/products` | 创建产品 |
| PUT | `/products/:id` | 更新产品 |
| DELETE | `/products/:id` | 删除产品 |
| GET | `/products/categories` | 获取产品分类 |

### 合同管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/contracts` | 查询合同列表 |
| GET | `/contracts/:id` | 获取合同详情 |
| POST | `/contracts` | 创建合同 |
| PUT | `/contracts/:id` | 更新合同 |
| DELETE | `/contracts/:id` | 删除合同 |

### 送货单管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/delivery-orders` | 查询送货单列表 |
| GET | `/delivery-orders/:id` | 获取送货单详情 |
| POST | `/delivery-orders` | 创建送货单 |
| PUT | `/delivery-orders/:id` | 更新送货单 |
| DELETE | `/delivery-orders/:id` | 删除送货单 |

### 库存管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/stock-records` | 查询库存记录列表 |
| GET | `/stock-records/:id` | 获取库存记录详情 |
| POST | `/stock-records` | 创建库存记录（入库/出库） |
| PUT | `/stock-records/:id` | 更新库存记录 |
| DELETE | `/stock-records/:id` | 删除库存记录 |
| GET | `/stock-records/statistics` | 获取库存统计 |

### 发票管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/invoices` | 查询发票列表 |
| GET | `/invoices/:id` | 获取发票详情 |
| POST | `/invoices` | 创建发票 |
| PUT | `/invoices/:id` | 更新发票 |
| DELETE | `/invoices/:id` | 删除发票 |

### 收付款管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/payments` | 查询收付款列表 |
| GET | `/payments/:id` | 获取收付款详情 |
| POST | `/payments` | 创建收付款 |
| PUT | `/payments/:id` | 更新收付款 |
| DELETE | `/payments/:id` | 删除收付款 |

### 对账管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/reconciliation/upstream` | 上游对账（厂家） |
| GET | `/reconciliation/downstream` | 下游对账（项目） |
| PUT | `/reconciliation/:id/status` | 更新对账状态 |

---

## 前端页面结构

### 布局组件
- `src/layout/index.vue` - 主布局（侧边栏 + 顶部导航）

### 页面组件

| 路径 | 页面名称 | 说明 |
|------|----------|------|
| `/dashboard` | 首页工作台 | 数据概览、快捷入口 |
| `/business/supplier` | 厂家管理 | 供应商信息管理 |
| `/business/project` | 项目管理 | 工地项目信息 |
| `/business/reconciliation-unit` | 对账单位 | 下游客户信息 |
| `/business/product` | 产品管理 | 商品品类管理 |
| `/business/contract` | 合同管理 | 合同信息管理 |
| `/business/delivery` | 送货单管理 | 送货单信息 |
| `/business/upstream` | 上游对账 | 与厂家对账 |
| `/business/downstream` | 下游对账 | 与项目对账 |
| `/finance/stock` | 库存管理 | 入库/出库管理 |
| `/finance/invoice` | 发票管理 | 发票信息 |
| `/finance/payment` | 收付款管理 | 收款/付款记录 |
| `/finance/reconciliation` | 往来核销 | 核销管理 |
| `/report` | 数据报表 | 统计报表 |
| `/login` | 登录页 | 用户登录 |

---

## 数据导入脚本

### 运行脚本

```bash
cd backend

# 导入基础数据
npx ts-node scripts/import-data.ts

# 同步项目数据
npx ts-node scripts/sync-projects.ts

# 重新导入客户数据
npx ts-node scripts/reimport-customers.ts
```

### 脚本说明

| 脚本 | 说明 |
|------|------|
| `import-data.ts` | 导入对账单位、客户、产品基础数据 |
| `sync-projects.ts` | 从对账单位同步项目数据 |
| `reimport-customers.ts` | 重新导入客户数据 |
| `reimport-manufacturers.ts` | 重新导入厂家数据 |
| `fix-customer-type.ts` | 修复客户类型错误 |

---

## 接口文档

启动后端服务后访问：http://localhost:4000/api

## 项目结构

```
BuildLink/
├── backend/                    # 后端服务
│   ├── prisma/               # Prisma配置
│   ├── scripts/              # 数据导入脚本
│   ├── src/
│   │   ├── common/           # 公共组件
│   │   ├── modules/          # 业务模块
│   │   └── prisma/           # Prisma服务
│   └── package.json
├── frontend/                  # 前端应用
│   ├── src/
│   │   ├── api/              # API接口封装
│   │   ├── assets/           # 静态资源
│   │   ├── layout/           # 布局组件
│   │   ├── router/           # 路由配置
│   │   ├── stores/           # 状态管理
│   │   ├── types/            # TypeScript类型
│   │   ├── utils/            # 工具函数
│   │   └── views/            # 页面组件
│   └── package.json
└── README.md
```