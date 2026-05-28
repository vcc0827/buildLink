# 建材供销对账管理系统 (BuildLink)

建材行业供销商专属上下游对账 + 多角色财务一体化管理平台

## 技术栈

### 前端
- Vue 3 + Vite + TypeScript
- Element Plus
- Pinia (状态管理)
- Vue Router
- Axios
- Vitest (测试框架)

### 后端
- NestJS + TypeScript
- Prisma ORM
- MySQL 8.4
- JWT 认证
- Jest (测试框架)

## 测试账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | 123456 | 管理员 | 系统管理员，拥有所有权限 |
| finance | 123456 | 财务 | 财务人员，可管理发票、收付款、核销 |
| sales | 123456 | 业务员 | 业务员，可管理客户、合同、发货单 |
| statistician | 123456 | 统计员 | 统计员，可管理报货、送货单 |

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

### 5. 运行测试

```bash
# 前端测试
cd frontend
npm run test

# 后端测试
cd backend
npm run test
```

## 功能模块

### 业务模块
- 厂家管理（供应商信息管理）
- 项目管理（工地项目信息）
- 对账单位管理（下游客户信息）
- 产品管理（商品品类管理）
- 合同管理
- 送货单管理（支持砂浆、蒸压加气混凝土砌块两种类型）
- 上游对账（与厂家对账）
- 下游对账（与项目对账）

### 财务模块
- 库存管理（入库/出库）
- 发票管理（进项票、销项票）
- 收付款管理
- 往来核销
- 数据报表

---

## 核心功能特性

### 送货单管理
- **产品类型支持**：砂浆（mortar）、蒸压加气混凝土砌块（block）
- **明细管理**：支持多产品明细录入
- **金额验算**：自动校验数量×单价=金额
- **导入功能**：支持批量导入送货单数据
- **回收站**：软删除机制，支持恢复已删除单据

### 上游对账
- 按厂家汇总送货数据
- 支持按日期范围查询
- 自动计算合同单价金额
- 区分砂浆/砌块产品类型

### 下游对账
- 按项目汇总送货数据
- 支持按日期范围查询
- 自动计算合同单价金额
- 生成对账单明细

---

## 数据库表结构

### 核心表说明

| 表名 | 说明 | 核心字段 |
|------|------|----------|
| `users` | 用户表 | id, username, password, role, status |
| `customers` | 客户表（厂家/项目） | id, name, type(supplier/manufacturer/project), category, contact, phone, reconciliationUnitId |
| `reconciliation_units` | 对账单位表 | id, companyName, projectName, taxNumber, address, phone, contact, bankName, bankAccount, bankCode |
| `products` | 产品表 | id, name, category, spec, unit, price, pricingType |
| `contracts` | 合同表 | id, no, name, reconciliationUnitId, type, signedDate, status |
| `contract_items` | 合同明细表 | id, contractId, productId, productName, basePrice, adjustmentType, adjustmentValue, price |
| `delivery_orders` | 送货单表 | id, no, supplierId, customerId, productType, deliveryDate, totalAmount |
| `delivery_order_items` | 送货明细表 | id, deliveryOrderId, productId, quantity, price, amount, attributes |
| `stock_records` | 库存记录表 | id, no, type(in/out), buyerId, sellerId, productId, quantity, amount |
| `invoices` | 发票表 | id, type(in/out), invoiceNo, invoiceDate, amount, taxAmount, totalAmount, customerId |
| `payments` | 收付款表 | id, type(income/expense), amount, paymentDate, customerId, invoiceId |
| `statements` | 对账单表 | id, customerId, period, totalAmount, status |
| `price_info` | 信息价表 | id, region, category, model, spec, unit, taxIncludedPrice, taxExcludedPrice, month |

### 数据关系

```
ReconciliationUnit 1:N Customer(project)
Customer 1:N DeliveryOrder (supplierDeliveryOrders, customerDeliveryOrders)
Customer 1:N Invoice (inputInvoices, outputInvoices)
Customer 1:N Payment
Product 1:N ContractItem
Product 1:N DeliveryOrderItem
Contract 1:N ContractItem
Contract 1:N DeliveryOrder
DeliveryOrder 1:N DeliveryOrderItem
```

---

## 后端 API 接口

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/login` | 用户登录 |
| GET | `/auth/profile` | 获取用户信息 |

### 用户管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/users` | 查询用户列表 |

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
| GET | `/deliveries` | 查询送货单列表 |
| GET | `/deliveries/:id` | 获取送货单详情 |
| POST | `/deliveries` | 创建送货单 |
| PUT | `/deliveries/:id` | 更新送货单 |
| DELETE | `/deliveries/:id` | 删除送货单（软删除） |
| POST | `/deliveries/import` | 批量导入送货单 |

### 库存管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/stock` | 查询库存记录列表 |
| GET | `/stock/:id` | 获取库存记录详情 |
| POST | `/stock` | 创建库存记录（入库/出库） |
| PUT | `/stock/:id` | 更新库存记录 |
| DELETE | `/stock/:id` | 删除库存记录 |

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

---

## 前端页面结构

### 布局组件
- `src/layout/index.vue` - 主布局（侧边栏 + 顶部导航）

### 页面组件

| 路径 | 页面名称 | 说明 |
|------|----------|------|
| `/dashboard` | 首页工作台 | 数据概览、快捷入口 |
| `/supplier` | 厂家管理 | 供应商信息管理 |
| `/reconciliation-unit` | 对账单位 | 下游客户信息 |
| `/product` | 产品管理 | 商品品类管理 |
| `/price-info` | 信息价管理 | 月度信息价 |
| `/contract` | 合同管理 | 合同信息管理 |
| `/order` | 报货管理 | 报货登记 |
| `/delivery` | 送货单管理 | 送货单信息 |
| `/period-config` | 周期配置 | 对账周期设置 |
| `/period-reconciliation` | 周期对账 | 单据归集 |
| `/invoice` | 发票管理 | 发票信息 |
| `/receivable-payable` | 应收应付台账 | 往来台账 |
| `/payment` | 收付款核销 | 核销管理 |
| `/stock` | 库存管理 | 入库/出库管理 |
| `/report-diff` | 报货/送货差异表 | 差异报表 |
| `/report-receivable` | 应收应付报表 | 财务报表 |
| `/report-invoice` | 开票报表 | 发票报表 |
| `/system-user` | 用户管理 | 系统用户管理 |
| `/system-role` | 角色权限 | 角色权限分配 |
| `/system-log` | 操作日志 | 系统日志 |
| `/login` | 登录页 | 用户登录 |

---

## 角色权限说明

| 角色 | 可访问模块 |
|------|-----------|
| admin | 所有模块 |
| finance | dashboard、财务中心、数据报表 |
| sales | dashboard、应收应付台账、数据报表 |
| statistician | dashboard、报货管理、送货单管理 |

---

## 测试框架

### 前端测试 (Vitest)

```bash
cd frontend

# 运行测试
npm run test

# 开发模式运行测试（watch）
npm run test:watch

# 生成测试覆盖率报告
npm run test:cov
```

### 后端测试 (Jest)

```bash
cd backend

# 运行测试
npm run test

# 开发模式运行测试（watch）
npm run test:watch

# 生成测试覆盖率报告
npm run test:cov
```

### 测试文件位置

| 位置 | 说明 |
|------|------|
| `frontend/src/stores/user.test.ts` | 用户状态管理测试 |
| `frontend/src/router/router.test.ts` | 路由守卫测试 |
| `backend/src/modules/auth/auth.service.spec.ts` | 认证服务测试 |

---

## 项目结构

```
BuildLink/
├── backend/                    # 后端服务
│   ├── prisma/               # Prisma配置
│   │   ├── migrations/       # 数据库迁移文件
│   │   └── schema.prisma     # 数据库schema
│   ├── scripts/              # 数据导入脚本
│   ├── src/
│   │   ├── common/           # 公共组件（过滤器、拦截器）
│   │   ├── modules/          # 业务模块
│   │   │   ├── auth/         # 认证模块
│   │   │   ├── contract/     # 合同模块
│   │   │   ├── customer/     # 客户模块
│   │   │   ├── delivery/     # 送货单模块
│   │   │   ├── invoice/      # 发票模块
│   │   │   ├── payment/      # 收付款模块
│   │   │   ├── price-info/   # 信息价模块
│   │   │   ├── product/      # 产品模块
│   │   │   ├── reconciliation/    # 对账模块
│   │   │   ├── reconciliation-unit/ # 对账单位模块
│   │   │   ├── statement/    # 对账单模块
│   │   │   ├── stock/        # 库存模块
│   │   │   └── user/         # 用户模块
│   │   ├── prisma/           # Prisma服务
│   │   ├── app.module.ts     # 应用模块
│   │   └── main.ts           # 入口文件
│   ├── jest.config.js        # Jest配置
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
│   ├── test/                 # 测试配置
│   ├── vitest.config.ts      # Vitest配置
│   └── package.json
└── README.md
```

---

## 更新日志

### v1.0.2 (2026-05-28)
- 🔴 修复 ProductService.getCategories() 查询不存在的 categoryName 字段导致的运行时崩溃
- 🟡 修复 Customer.remove() 合同关联检查逻辑错误（客户ID误用于合同 reconciliationUnitId 查询）
- 🟡 修复 Customer.remove() 中 customer 变量获取后未复用导致重复查询
- 🟡 修复 ProductService.update() 修改 categoryId 时不同步 categoryCode
- 🟡 修复 Invoice 列表格式化中 inputCustomer/outputCustomer 使用 || 歧义逻辑
- 🟡 修复 DeliveryService.processImportRow() 导入时每行全量查询客商（性能优化）
- 🟢 清理 delivery.dto.ts 中重复的 ProductCategoryDto 类型定义
- 🟢 统一 price-info.service.ts 的 PrismaService import 路径
- 🟢 StatementService.generate() 消除硬编码品类映射，改为可选 categoryCode 参数

### v1.0.1 (2026-05-26)
- 修复权限管理问题：登录后刷新页面角色信息丢失
- 修复路由守卫逻辑：dashboard页面权限处理
- 添加前端测试框架 (Vitest)
- 添加后端测试框架 (Jest)
- 编写用户信息持久化测试用例
- 编写路由守卫测试用例
- 更新API命名规范：统一使用 `get` 替代 `getById`

### v1.0.0 (2024-05-23)
- 新增送货单管理功能（砂浆、砌块两种产品类型）
- 新增送货单导入功能
- 新增送货单回收站功能（软删除）
- 新增上游对账功能
- 新增下游对账功能
- 完善合同明细表结构
- 新增信息价管理模块
- 优化库存记录结构
