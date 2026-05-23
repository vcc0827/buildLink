export interface UserInfo {
  id: number
  username: string
  nickname: string
  role: 'admin' | 'finance' | 'sales'
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

export interface ProductPriceHistory {
  id: number
  productId: number
  price: number
  effectiveDate: string
  createdAt: string
}

export interface DeliveryOrder {
  id: number
  no: string
  date: string
  projectId: number
  projectName: string
  supplierId: number
  supplierName: string
  region?: string
  contractBelong?: string
  salesman?: string
  driver?: string
  status: 'pending' | 'confirmed' | 'cancelled'
  remark?: string
  purchaseTotal?: number
  salesTotal?: number
  items: DeliveryOrderItemNew[]
  createdAt: string
  updatedAt: string
}

export interface DeliveryOrderItemNew {
  id?: number
  deliveryOrderId?: number
  productName: string
  spec?: string
  mortarTonnage?: number
  packingType?: string
  blockQuantity?: number
  receivedQuantity?: number
  cubicMeter?: number
  purchaseUnitPrice: number
  purchaseAmount: number
  salesUnitPrice: number
  salesAmount: number
  frameTaken: number
  frameReturned: number
  remark?: string
}

export interface DeliveryOrderMortarItem {
  id?: number
  deliveryOrderId?: number
  productId?: number
  quantity: number
  price: number
  amount: number
  mortarGrade: string
  packingType: string
  licensePlate: string
  product?: { id: number; name: string }
}

export interface DeliveryOrderBlockItem {
  id?: number
  deliveryOrderId?: number
  productId?: number
  model?: string
  quantity: number
  convertedCubic: number
  price: number
  amount: number
  frameTaken: number
  frameReturned: number
  remarks?: string
  product?: { id: number; name: string }
}

export type DeliveryOrderItem = DeliveryOrderMortarItem | DeliveryOrderBlockItem

export interface DeliveryItem {
  id: number
  productName: string
  specification?: string
  unit: string
  quantity: number
  unitPrice: number
  amount: number
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
