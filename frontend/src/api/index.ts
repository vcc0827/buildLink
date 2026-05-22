import request from '@/utils/request'
import type { ApiResponse, PageResult, UserInfo, Customer, Contract, DeliveryOrder, Statement, Invoice, Payment, Reconciliation, ReconciliationUnit, Product } from '@/types'

export const authApi = {
  login: (data: { username: string; password: string }) =>
    request.post<any, ApiResponse<{ token: string; userInfo: UserInfo }>>('/auth/login', data),
  logout: () => request.post<any, ApiResponse>('/auth/logout'),
  getUserInfo: () => request.get<any, ApiResponse<UserInfo>>('/auth/userinfo')
}

export const customerApi = {
  list: (params: any) =>
    request.get<any, ApiResponse<PageResult<Customer>>>('/customers', { params }),
  get: (id: number) =>
    request.get<any, ApiResponse<Customer>>(`/customers/${id}`),
  getById: (id: number) =>
    request.get<any, ApiResponse<Customer>>(`/customers/${id}`),
  create: (data: Partial<Customer>) =>
    request.post<any, ApiResponse<Customer>>('/customers', data),
  update: (id: number, data: Partial<Customer>) =>
    request.put<any, ApiResponse<Customer>>(`/customers/${id}`, data),
  delete: (id: number) =>
    request.delete<any, ApiResponse>(`/customers/${id}`)
}

export const contractApi = {
  list: (params: any) =>
    request.get<any, ApiResponse<PageResult<Contract>>>('/contracts', { params }),
  getById: (id: number) =>
    request.get<any, ApiResponse<Contract>>(`/contracts/${id}`),
  create: (data: Partial<Contract>) =>
    request.post<any, ApiResponse<Contract>>('/contracts', data),
  update: (id: number, data: Partial<Contract>) =>
    request.put<any, ApiResponse<Contract>>(`/contracts/${id}`, data),
  delete: (id: number) =>
    request.delete<any, ApiResponse>(`/contracts/${id}`)
}

export const deliveryApi = {
  list: (params: any) =>
    request.get<any, ApiResponse<PageResult<DeliveryOrder>>>('/deliveries', { params }),
  get: (id: number) =>
    request.get<any, ApiResponse<DeliveryOrder>>(`/deliveries/${id}`),
  getById: (id: number) =>
    request.get<any, ApiResponse<DeliveryOrder>>(`/deliveries/${id}`),
  create: (data: Partial<DeliveryOrder>) =>
    request.post<any, ApiResponse<DeliveryOrder>>('/deliveries', data),
  update: (id: number, data: Partial<DeliveryOrder>) =>
    request.put<any, ApiResponse<DeliveryOrder>>(`/deliveries/${id}`, data),
  delete: (id: number) =>
    request.delete<any, ApiResponse>(`/deliveries/${id}`),
  getDeleted: (params: any) =>
    request.get<any, ApiResponse<PageResult<DeliveryOrder>>>('/deliveries/deleted', { params }),
  restore: (id: number) =>
    request.post<any, ApiResponse>(`/deliveries/restore/${id}`),
  getProductNames: () =>
    request.get<any, ApiResponse<string[]>>('/deliveries/product-names'),
  getSupplierReconciliation: (params: any) =>
    request.get<any, ApiResponse<PageResult<any>>>('/deliveries/reconciliation/supplier', { params }),
  getSupplierDeliveryDetail: (params: any) =>
    request.get<any, ApiResponse<{ list: any[]; customerName: string; productType: string; totals: any }>>('/deliveries/reconciliation/supplier/detail', { params }),
  getCustomerReconciliation: (params: any) =>
    request.get<any, ApiResponse<PageResult<any>>>('/deliveries/reconciliation/customer', { params }),
  getCustomerDeliveryDetail: (params: any) =>
    request.get<any, ApiResponse<{ list: any[]; customerName: string; productType: string; totals: any }>>('/deliveries/reconciliation/customer/detail', { params }),
  importDeliveryOrders: (data: any) =>
    request.post<any, ApiResponse<{ success: number; failed: number; errors: any[] }>>('/deliveries/import', data)
}

export const statementApi = {
  list: (params: any) =>
    request.get<any, ApiResponse<PageResult<Statement>>>('/statements', { params }),
  getById: (id: number) =>
    request.get<any, ApiResponse<Statement>>(`/statements/${id}`),
  create: (data: Partial<Statement>) =>
    request.post<any, ApiResponse<Statement>>('/statements', data),
  update: (id: number, data: Partial<Statement>) =>
    request.put<any, ApiResponse<Statement>>(`/statements/${id}`, data),
  generate: (params: { type: string; customerId: number; period: string }) =>
    request.post<any, ApiResponse<Statement>>('/statements/generate', null, { params })
}

export const invoiceApi = {
  list: (params: any) =>
    request.get<any, ApiResponse<PageResult<Invoice>>>('/invoices', { params }),
  getById: (id: number) =>
    request.get<any, ApiResponse<Invoice>>(`/invoices/${id}`),
  create: (data: Partial<Invoice>) =>
    request.post<any, ApiResponse<Invoice>>('/invoices', data),
  update: (id: number, data: Partial<Invoice>) =>
    request.put<any, ApiResponse<Invoice>>(`/invoices/${id}`, data),
  delete: (id: number) =>
    request.delete<any, ApiResponse>(`/invoices/${id}`)
}

export const paymentApi = {
  list: (params: any) =>
    request.get<any, ApiResponse<PageResult<Payment>>>('/payments', { params }),
  getById: (id: number) =>
    request.get<any, ApiResponse<Payment>>(`/payments/${id}`),
  create: (data: Partial<Payment>) =>
    request.post<any, ApiResponse<Payment>>('/payments', data),
  update: (id: number, data: Partial<Payment>) =>
    request.put<any, ApiResponse<Payment>>(`/payments/${id}`, data),
  delete: (id: number) =>
    request.delete<any, ApiResponse>(`/payments/${id}`)
}

export const reconciliationApi = {
  list: (params: any) =>
    request.get<any, ApiResponse<PageResult<Reconciliation>>>('/reconciliations', { params }),
  getById: (id: number) =>
    request.get<any, ApiResponse<Reconciliation>>(`/reconciliations/${id}`),
  create: (data: Partial<Reconciliation>) =>
    request.post<any, ApiResponse<Reconciliation>>('/reconciliations', data),
  autoReconcile: (params: { customerId: number; type: string }) =>
    request.post<any, ApiResponse>('/reconciliations/auto', null, { params })
}

export const reconciliationUnitApi = {
  list: (params: any) =>
    request.get<any, ApiResponse<PageResult<ReconciliationUnit>>>('/reconciliation-units', { params }),
  getById: (id: number) =>
    request.get<any, ApiResponse<ReconciliationUnit>>(`/reconciliation-units/${id}`),
  create: (data: Partial<ReconciliationUnit>) =>
    request.post<any, ApiResponse<ReconciliationUnit>>('/reconciliation-units', data),
  update: (id: number, data: Partial<ReconciliationUnit>) =>
    request.put<any, ApiResponse<ReconciliationUnit>>(`/reconciliation-units/${id}`, data),
  delete: (id: number) =>
    request.delete<any, ApiResponse>(`/reconciliation-units/${id}`)
}

export const productApi = {
  list: (params: any) =>
    request.get<any, ApiResponse<PageResult<Product>>>('/products', { params }),
  getById: (id: number) =>
    request.get<any, ApiResponse<Product>>(`/products/${id}`),
  create: (data: Partial<Product>) =>
    request.post<any, ApiResponse<Product>>('/products', data),
  update: (id: number, data: Partial<Product>) =>
    request.put<any, ApiResponse<Product>>(`/products/${id}`, data),
  delete: (id: number) =>
    request.delete<any, ApiResponse>(`/products/${id}`),
  getCategories: () =>
    request.get<any, ApiResponse<string[]>>('/products/categories'),
  getByCategory: (name: string) =>
    request.get<any, ApiResponse<Product[]>>(`/products/by-category/${encodeURIComponent(name)}`)
}

export const stockApi = {
  list: (params: any) =>
    request.get<any, ApiResponse<PageResult<any>>>('/stock/records', { params }),
  listWithBalance: (params: any) =>
    request.get<any, ApiResponse<any[]>>('/stock/records-with-balance', { params }),
  getById: (id: number) =>
    request.get<any, ApiResponse<any>>(`/stock/records/${id}`),
  create: (data: any) =>
    request.post<any, ApiResponse<any>>('/stock/records', data),
  update: (id: number, data: any) =>
    request.put<any, ApiResponse<any>>(`/stock/records/${id}`, data),
  delete: (id: number) =>
    request.delete<any, ApiResponse>(`/stock/records/${id}`),
  getSummary: (params: any) =>
    request.get<any, ApiResponse<any[]>>('/stock/summary', { params })
}
