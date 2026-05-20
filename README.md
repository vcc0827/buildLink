# 建材供销对账管理系统 (BuildLink)

建材行业供销商专属上下游对账 + 多角色财务一体化管理平台

## 技术栈

### 前端
- Vue 3 + Vite + TypeScript
- Element Plus
- Pinia (状态管理)
- Vue Router

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

配置 `.env` 文件：

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
- 客商管理（供应商、工地项目）
- 合同管理
- 送货单管理
  - **软删除机制**：删除的送货单不会物理删除，而是标记 `deletedAt` 时间戳
  - **回收站功能**：可查看和恢复已删除的送货单（入口默认隐藏，通过设置前端变量 `showRecycleBin = true` 显示）
- 上游对账
  - 按厂家聚合送货单数据
  - 基于厂家合同单价计算金额
  - 支持砌块/砂浆两种产品类型展示
  - 可修改对账状态
- 下游对账
  - 按项目聚合送货单数据
  - 基于项目合同单价计算金额
  - 支持砌块/砂浆两种产品类型展示
  - 可修改对账状态

### 财务模块
- 发票管理（进项票、销项票）
- 收付款管理
- 往来核销
- 数据报表

## 接口文档

启动后端服务后访问：http://localhost:4000/api
