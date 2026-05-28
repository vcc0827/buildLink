/**
 * 送货单模块 DTO 类型定义
 */

// ============================================
// 送货单主表 DTO
// ============================================

export interface CreateDeliveryOrderDto {
  /** 送货单号（可选，由系统自动生成） */
  no?: string;
  /** 合同ID */
  contractId?: number;
  /** 供应商ID */
  supplierId: number;
  /** 客户ID */
  customerId: number;
  /** 产品品类编码 */
  categoryCode: string;
  /** 送货日期 */
  deliveryDate: string | Date;
  /** 状态 */
  status?: 'pending' | 'delivered' | 'confirmed';
  /** 备注 */
  remark?: string;
  /** 明细列表 */
  items: CreateDeliveryOrderItemDto[];
}

export interface UpdateDeliveryOrderDto {
  /** 合同ID */
  contractId?: number;
  /** 供应商ID */
  supplierId?: number;
  /** 客户ID */
  customerId?: number;
  /** 产品品类编码 */
  categoryCode?: string;
  /** 送货日期 */
  deliveryDate?: string | Date;
  /** 状态 */
  status?: 'pending' | 'delivered' | 'confirmed';
  /** 备注 */
  remark?: string;
  /** 明细列表（更新时传入则替换全部明细） */
  items?: CreateDeliveryOrderItemDto[];
}

export interface DeliveryOrderQueryDto {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 送货单号 */
  no?: string;
  /** 产品品类编码 */
  categoryCode?: string;
  /** 供应商ID */
  supplierId?: number;
  /** 客户ID */
  customerId?: number;
  /** 状态 */
  status?: string;
  /** 开始日期 */
  startDate?: string;
  /** 结束日期 */
  endDate?: string;
}

// ============================================
// 送货单明细 DTO
// ============================================

export interface CreateDeliveryOrderItemDto {
  /** 产品ID */
  productId?: number;
  /** 数量 */
  quantity: number;
  /** 单价 */
  price: number;
  /** 金额（会自动验算） */
  amount: number;
  /** 品类专属属性 */
  attributes?: DeliveryOrderItemAttributes;
}

export interface DeliveryOrderItemAttributes {
  // 砂浆属性
  /** 砂浆标号 */
  mortarGrade?: string;
  /** 包装类型：bulk(散装), bagged(袋包) */
  packingType?: string;
  /** 车牌号 */
  licensePlate?: string;

  // 砌块属性
  /** 折立方数 */
  convertedCubic?: number;
  /** 带去铁架数量 */
  frameTaken?: number;
  /** 带回铁架数量 */
  frameReturned?: number;
  /** 备注 */
  remarks?: string;

  // 保温板属性（预留）
  /** 厚度 */
  thickness?: number;
  /** 长度 */
  length?: number;
  /** 宽度 */
  width?: number;
  /** 层数 */
  layers?: number;

  // 钢筋属性（预留）
  /** 直径 */
  diameter?: number;
  /** 理论重量 */
  weight?: number;
}

// ============================================
// 送货单响应 DTO
// ============================================

export interface DeliveryOrderResponseDto {
  id: number;
  no: string;
  contractId?: number;
  contractNo?: string;
  supplierId: number;
  supplierName: string;
  customerId: number;
  customerName: string;
  categoryCode: string;
  categoryName?: string;
  deliveryDate: string;
  totalAmount: number;
  status: string;
  receiptUrl?: string;
  remark?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  items: DeliveryOrderItemResponseDto[];
}

export interface DeliveryOrderItemResponseDto {
  id: number;
  deliveryOrderId: number;
  productId?: number;
  productName?: string;
  productSpec?: string;
  quantity: number;
  price: number;
  amount: number;
  attributes: DeliveryOrderItemAttributes;
}

// ============================================
// 对账相关 DTO
// ============================================

export interface ReconciliationQueryDto {
  /** 供应商ID/客户ID */
  supplierId?: number;
  customerId?: number;
  /** 开始日期 */
  startDate: string;
  /** 结束日期 */
  endDate: string;
  /** 产品品类编码 */
  categoryCode?: string;
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}

export interface SupplierReconciliationItem {
  supplierId: number;
  supplierName: string;
  categoryCode: string;
  categoryName?: string;
  totalQuantity: number;
  totalAmount: number;
  deliveryCount: number;
  status: 'unreconciled' | 'reconciled';
}

export interface CustomerReconciliationItem {
  customerId: number;
  customerName: string;
  categoryCode: string;
  categoryName?: string;
  totalQuantity: number;
  totalAmount: number;
  deliveryCount: number;
  status: 'unreconciled' | 'reconciled';
}

export interface SupplierDeliveryDetailItem {
  deliveryDate: string;
  deliveryMethod: string;
  deliveryNo: string;
  spec: string;
  type: string;
  quantity: string;
  receivedQuantity: string;
  deduction: string;
  convertedCubic: string;
  contractPrice: string;
  amount: string;
  remark: string;
  customerName?: string;
  mortarGrade?: string;
  packingType?: string;
  price: string;
}

export interface CustomerDeliveryDetailItem {
  deliveryDate: string;
  supplierName?: string;
  mortarGrade?: string;
  packingType?: string;
  deliveryMethod?: string;
  deliveryNo?: string;
  spec?: string;
  type?: string;
  quantity: string;
  receivedQuantity?: string;
  deduction?: string;
  convertedCubic?: string;
  contractPrice: string;
  amount: string;
  remarks?: string;
}

export interface DeliveryDetailTotals {
  totalQuantity: number;
  totalAmount: number;
  deductVolume: number;
  convertedCubic: number;
}

// ============================================
// 导入相关 DTO
// ============================================

export interface ImportDeliveryOrderDto {
  /** 产品品类编码 */
  categoryCode: string;
  /** 导入的行数据 */
  rows: Record<string, any>[];
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  message: string;
  data: Record<string, any>;
}
