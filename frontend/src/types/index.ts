export interface UserInfo {
  id: number
  username: string
  nickname: string
  role: 'admin' | 'finance' | 'sales' | 'statistician'
  email?: string
  phone?: string
  deptId?: number
}

export interface MenuItem {
  id: number
  name: string
  path: string
  icon?: string
  children?: MenuItem[]
  permission?: string
}

export interface Customer {
  id: number
  name: string
  type: 'supplier' | 'project'
  category?: string
  contact?: string
  phone?: string
  address?: string
  bank?: string
  account?: string
  status: 'active' | 'inactive'
  remark?: string
  reconciliationUnitId?: number
  reconciliationUnitName?: string
  createdAt: string
  updatedAt: string
}

export interface ReconciliationUnit {
  id: number
  companyName: string
  projectName: string
  taxNumber?: string
  address?: string
  phone?: string
  contact?: string
  bankName?: string
  bankAccount?: string
  bankCode?: string
  status: 'active' | 'inactive'
  remark?: string
  projectCount?: number
  createdAt: string
  updatedAt: string
}

export interface ContractItem {
  id?: number
  contractId?: number
  productId?: number
  productName: string
  unit: string
  price: number
  basePrice?: number
  adjustmentType?: string
  adjustmentValue?: number
  model?: string
  spec?: string
  product?: { id: number; name: string }
}

export interface Contract {
  id: number
  no: string
  name: string
  reconciliationUnitId?: number
  companyName?: string
  projectName?: string
  type?: string
  signedDate: string
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  reconciliationCycle: 'monthly' | 'quarterly' | 'yearly'
  discountRate?: number
  settlementMethod: 'transfer' | 'cash' | 'check'
  remark?: string
  items?: ContractItem[]
  itemCount?: number
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: number
  name: string
  unit: string
  model?: string
  spec?: string
  price: number
  pricingType: 'info_price' | 'fixed_price'
  status: 'active' | 'inactive'
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface ProductCategory {
  id: number
  code: string
  name: string
  unit: string
  fields?: ProductCategoryField[]
  status: string
  sort: number
}

export interface ProductCategoryField {
  code: string
  name: string
  type: 'string' | 'number' | 'select' | 'date'
  required?: boolean
  defaultValue?: any
  options?: { label: string; value: string }[]
  sort?: number
}

// ============================================
// 报货单
// ============================================
export interface OrderItem {
  id?: number
  orderId?: number
  productId?: number
  productName?: string
  productSpec?: string
  quantity: number
  unit: string
}

export interface Order {
  id: number
  no: string
  contractId?: number
  contractNo?: string
  supplierId: number
  supplierName: string
  customerId: number
  customerName: string
  categoryCode: string
  categoryName?: string
  planDeliveryDate: string
  status: 'pending' | 'delivered' | 'cancelled'
  items: OrderItem[]
  totalQuantity: number
  remark?: string
  createdAt: string
  updatedAt: string
}

// ============================================
// 送货单明细（通用结构）
// ============================================
export interface DeliveryOrderItemAttributes {
  // 砂浆属性
  mortarGrade?: string
  packingType?: 'bulk' | 'bagged'
  licensePlate?: string

  // 砌块属性
  convertedCubic?: number
  frameTaken?: number
  frameReturned?: number
  remarks?: string

  // 其他品类可扩展
  [key: string]: any
}

export interface DeliveryOrderItem {
  id: number
  deliveryOrderId: number
  productId?: number
  productName?: string
  productSpec?: string
  quantity: number
  receivedQuantity?: number
  price: number
  amount: number
  attributes: DeliveryOrderItemAttributes
}

// ============================================
// 送货单（重构后）
// ============================================
export interface DeliveryOrder {
  id: number
  no: string
  contractId?: number
  contractNo?: string
  supplierId: number
  supplierName: string
  customerId: number
  customerName: string
  categoryCode: string
  categoryName?: string
  deliveryDate: string
  businessType: 'contract' | 'retail'
  items: DeliveryOrderItem[]
  totalAmount: number
  status: 'pending' | 'delivered' | 'confirmed'
  receiptUrl?: string
  remark?: string
  diffRemark?: string
  deletedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Statement {
  id: number
  no: string
  type: 'upstream' | 'downstream'
  customerId: number
  customerName: string
  period: string
  totalAmount: number
  confirmedAmount: number
  status: 'draft' | 'confirmed' | 'invoiced' | 'paid'
  items: StatementItem[]
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface StatementItem {
  deliveryOrderId: number
  deliveryOrderNo: string
  deliveryDate: string
  amount: number
  invoicedAmount: number
  paidAmount: number
}

export interface Invoice {
  id: number
  no: string
  type: 'input' | 'output'
  customerId: number
  customerName: string
  invoiceDate: string
  amount: number
  taxAmount: number
  totalAmount: number
  status: 'pending' | 'received' | 'issued' | 'verified' | 'cancelled'
  verifyStatus: 'unverified' | 'verified'
  cancelStatus: 'uncancelled' | 'cancelled'
  cancelReason?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: number
  no: string
  type: 'payment' | 'receivable'
  customerId: number
  customerName: string
  bank: string
  account: string
  amount: number
  paymentDate: string
  voucherUrl?: string
  status: 'pending' | 'confirmed'
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface Reconciliation {
  id: number
  no: string
  type: 'upstream' | 'downstream'
  customerId: number
  customerName: string
  statementId: number
  invoiceId?: number
  paymentId?: number
  amount: number
  reconcileDate: string
  status: 'confirmed'
  remark?: string
  createdAt: string
}

export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
}

export interface PageResult<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
