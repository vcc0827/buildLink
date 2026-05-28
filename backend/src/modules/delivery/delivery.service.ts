import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateDeliveryOrderDto,
  UpdateDeliveryOrderDto,
  DeliveryOrderQueryDto,
  DeliveryOrderResponseDto,
  DeliveryOrderItemResponseDto,
  ReconciliationQueryDto,
  SupplierReconciliationItem,
  CustomerReconciliationItem,
  SupplierDeliveryDetailItem,
  CustomerDeliveryDetailItem,
  DeliveryDetailTotals,
  ImportDeliveryOrderDto,
  ImportResult,
  ImportError,
} from './dto';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // 基础 CRUD
  // ============================================

  async findAll(query: DeliveryOrderQueryDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { no, categoryCode, supplierId, customerId, status, startDate, endDate } = query;

    const where: any = { deletedAt: null };
    if (no) where.no = { contains: no };
    if (categoryCode) where.categoryCode = categoryCode;
    if (supplierId) where.supplierId = Number(supplierId);
    if (customerId) where.customerId = Number(customerId);
    if (status) where.status = status;

    if (startDate && endDate) {
      where.deliveryDate = {
        gte: new Date(startDate),
        lte: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1),
      };
    }

    const [list, total] = await Promise.all([
      this.prisma.deliveryOrder.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
        include: {
          supplier: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
          contract: { select: { id: true, no: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, spec: true, categoryId: true } },
            },
          },
        },
      }),
      this.prisma.deliveryOrder.count({ where }),
    ]);

    // 获取品类名称映射
    const categoryMap = await this.getCategoryNameMap();
    const categories = await this.prisma.productCategory.findMany();
    const categoryCodeMap = Object.fromEntries(categories.map(c => [c.code, c]));

    const formatted = list.map((item) => this.formatDeliveryOrder(item, categoryCodeMap));

    return { list: formatted, total, page, pageSize };
  }

  async findOne(id: number): Promise<DeliveryOrderResponseDto> {
    const order = await this.prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        contract: { select: { id: true, no: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, spec: true, categoryId: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('送货单不存在');
    }

    const categories = await this.prisma.productCategory.findMany();
    const categoryCodeMap = Object.fromEntries(categories.map(c => [c.code, c]));

    return this.formatDeliveryOrder(order, categoryCodeMap);
  }

  async create(data: CreateDeliveryOrderDto) {
    // 验证品类编码
    const category = await this.prisma.productCategory.findUnique({
      where: { code: data.categoryCode },
    });
    if (!category) {
      throw new BadRequestException(`产品品类「${data.categoryCode}」不存在`);
    }

    // 验证必填字段
    if (!data.supplierId || !data.customerId) {
      throw new BadRequestException('供应商和客户不能为空');
    }

    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('至少需要一条明细');
    }

    // 处理送货日期
    let deliveryDate: Date;
    if (typeof data.deliveryDate === 'string') {
      deliveryDate = new Date(data.deliveryDate);
    } else {
      deliveryDate = data.deliveryDate;
    }

    // 计算总金额
    const totalAmount = data.items.reduce((sum, item) => {
      return sum + this.validateAndCalcAmount(item, data.categoryCode);
    }, 0);

    // 生成单号
    const no = data.no || `SHD-${Date.now()}`;

    // 创建送货单
    const order = await this.prisma.deliveryOrder.create({
      data: {
        no,
        categoryCode: data.categoryCode,
        supplierId: data.supplierId,
        customerId: data.customerId,
        contractId: data.contractId,
        deliveryDate,
        totalAmount,
        status: data.status || 'pending',
        remark: data.remark || '',
        items: {
          create: data.items.map((item) => this.formatItemData(item)),
        },
      },
      include: {
        supplier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, spec: true } },
          },
        },
      },
    });

    const categories = await this.prisma.productCategory.findMany();
    const categoryCodeMap = Object.fromEntries(categories.map(c => [c.code, c]));

    return this.formatDeliveryOrder(order, categoryCodeMap);
  }

  async update(id: number, data: UpdateDeliveryOrderDto) {
    // 验证送货单存在
    const existing = await this.prisma.deliveryOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      throw new NotFoundException('送货单不存在');
    }

    // 如果更换了品类，验证新品类
    if (data.categoryCode && data.categoryCode !== existing.categoryCode) {
      const category = await this.prisma.productCategory.findUnique({
        where: { code: data.categoryCode },
      });
      if (!category) {
        throw new BadRequestException(`产品品类「${data.categoryCode}」不存在`);
      }
    }

    const updateData: any = {};

    if (data.supplierId !== undefined) updateData.supplierId = data.supplierId;
    if (data.customerId !== undefined) updateData.customerId = data.customerId;
    if (data.categoryCode !== undefined) updateData.categoryCode = data.categoryCode;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.remark !== undefined) updateData.remark = data.remark;

    if (data.deliveryDate !== undefined) {
      updateData.deliveryDate = typeof data.deliveryDate === 'string'
        ? new Date(data.deliveryDate)
        : data.deliveryDate;
    }

    if (data.contractId !== undefined) {
      updateData.contract = data.contractId
        ? { connect: { id: data.contractId } }
        : { disconnect: true };
    }

    // 如果更新了明细
    if (data.items && data.items.length > 0) {
      const categoryCode = data.categoryCode || existing.categoryCode;
      const totalAmount = data.items.reduce((sum, item) => {
        return sum + this.validateAndCalcAmount(item, categoryCode);
      }, 0);
      updateData.totalAmount = totalAmount;

      // 删除旧明细，创建新明细
      await this.prisma.deliveryOrderItem.deleteMany({
        where: { deliveryOrderId: id },
      });

      updateData.items = {
        create: data.items.map((item) => this.formatItemData(item)),
      };
    }

    const order = await this.prisma.deliveryOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        contract: { select: { id: true, no: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, spec: true } },
          },
        },
      },
    });

    const categories = await this.prisma.productCategory.findMany();
    const categoryCodeMap = Object.fromEntries(categories.map(c => [c.code, c]));

    return this.formatDeliveryOrder(order, categoryCodeMap);
  }

  async remove(id: number) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('无效的送货单ID');
    }
    return this.prisma.deliveryOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: number) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('无效的送货单ID');
    }
    const order = await this.prisma.deliveryOrder.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('送货单不存在');
    }
    if (!order.deletedAt) {
      throw new BadRequestException('该送货单未被删除，无需恢复');
    }
    return this.prisma.deliveryOrder.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async getDeleted(query: DeliveryOrderQueryDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const where: any = { deletedAt: { not: null } };

    const [list, total] = await Promise.all([
      this.prisma.deliveryOrder.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { deletedAt: 'desc' },
        include: {
          supplier: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
          items: true,
        },
      }),
      this.prisma.deliveryOrder.count({ where }),
    ]);

    const categories = await this.prisma.productCategory.findMany();
    const categoryCodeMap = Object.fromEntries(categories.map(c => [c.code, c]));

    const formatted = list.map((item) => this.formatDeliveryOrder(item, categoryCodeMap));

    return { list: formatted, total, page, pageSize };
  }

  // ============================================
  // 批量导入
  // ============================================

  async importDeliveryOrders(data: ImportDeliveryOrderDto): Promise<ImportResult> {
    const { categoryCode, rows } = data;
    const errors: ImportError[] = [];
    const results: ImportResult = { success: 0, failed: 0, errors: [] };

    // 验证品类
    const category = await this.prisma.productCategory.findUnique({
      where: { code: categoryCode },
    });
    if (!category) {
      throw new BadRequestException(`产品品类「${categoryCode}」不存在`);
    }

    const allSuppliers = await this.prisma.customer.findMany({
      where: { type: 'supplier' },
    });
    const allCustomers = await this.prisma.customer.findMany({
      where: { type: 'project' },
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        const importResult = await this.processImportRow(row, categoryCode, rowNum, allSuppliers, allCustomers);
        if (importResult.error) {
          errors.push({ row: rowNum, message: importResult.error, data: row });
        }
      } catch (e: any) {
        errors.push({ row: rowNum, message: `处理失败：${e.message}`, data: row });
      }
    }

    if (errors.length > 0) {
      results.failed = errors.length;
      results.errors = errors;
      return results;
    }

    results.success = rows.length;
    return results;
  }

  // ============================================
  // 上下游对账
  // ============================================

  async getSupplierReconciliation(query: ReconciliationQueryDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { supplierId, startDate, endDate, categoryCode } = query;

    const where: any = {
      deliveryDate: {
        gte: new Date(startDate),
        lte: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1),
      },
    };

    if (supplierId) {
      where.supplierId = Number(supplierId);
    }
    if (categoryCode) {
      where.categoryCode = categoryCode;
    }

    const deliveryOrders = await this.prisma.deliveryOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        items: {
          include: { product: { select: { spec: true } } },
        },
      },
    });

    // 获取品类映射
    const categories = await this.prisma.productCategory.findMany();
    const categoryCodeMap = Object.fromEntries(categories.map(c => [c.code, c]));

    // 按供应商和品类分组
    const grouped: Record<string, SupplierReconciliationItem> = {};

    deliveryOrders.forEach((order) => {
      const key = `${order.supplierId}-${order.categoryCode}`;
      if (!grouped[key]) {
        const category = categoryCodeMap[order.categoryCode];
        grouped[key] = {
          supplierId: order.supplierId,
          supplierName: order.supplier?.name || '',
          categoryCode: order.categoryCode,
          categoryName: category?.name || order.categoryCode,
          totalQuantity: 0,
          totalAmount: 0,
          deliveryCount: 0,
          status: 'unreconciled',
        };
      }

      order.items.forEach((item: any) => {
        grouped[key].totalQuantity += parseFloat(item.quantity || 0);

        // 根据品类计算金额
        const calcQuantity = this.getCalculationQuantity(order.categoryCode, item);
        const contractPrice = parseFloat(item.price || 0);
        grouped[key].totalAmount += calcQuantity * contractPrice;
      });
      grouped[key].deliveryCount++;
    });

    const list = Object.values(grouped).map((item) => ({
      ...item,
      totalQuantity: parseFloat(item.totalQuantity.toFixed(4)),
      totalAmount: parseFloat(item.totalAmount.toFixed(2)),
    }));

    list.sort((a, b) => b.totalAmount - a.totalAmount);

    const total = list.length;
    const paginatedList = list.slice((page - 1) * pageSize, page * pageSize);

    return { list: paginatedList, total, page, pageSize };
  }

  async getSupplierDeliveryDetail(query: ReconciliationQueryDto) {
    const { supplierId, startDate, endDate, categoryCode } = query;

    const where: any = {
      supplierId: Number(supplierId),
      deliveryDate: {
        gte: new Date(startDate),
        lte: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1),
      },
    };

    if (categoryCode) {
      where.categoryCode = categoryCode;
    }

    const deliveryOrders = await this.prisma.deliveryOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, spec: true } },
          },
        },
      },
      orderBy: { deliveryDate: 'asc' },
    });

    // 获取合同价格映射
    const contractPriceMap = await this.getContractPriceMap(Number(supplierId));

    const list: SupplierDeliveryDetailItem[] = [];

    deliveryOrders.forEach((order) => {
      order.items.forEach((item: any) => {
        const itemData = this.formatDetailItem(order, item, contractPriceMap);
        list.push(itemData);
      });
    });

    return { list };
  }

  async getCustomerReconciliation(query: ReconciliationQueryDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { customerId, startDate, endDate, categoryCode } = query;

    const where: any = {
      deliveryDate: {
        gte: new Date(startDate),
        lte: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1),
      },
    };

    if (customerId) {
      where.customerId = Number(customerId);
    }
    if (categoryCode) {
      where.categoryCode = categoryCode;
    }

    const deliveryOrders = await this.prisma.deliveryOrder.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        items: {
          include: { product: { select: { spec: true } } },
        },
      },
    });

    // 获取品类映射
    const categories = await this.prisma.productCategory.findMany();
    const categoryCodeMap = Object.fromEntries(categories.map(c => [c.code, c]));

    const grouped: Record<string, CustomerReconciliationItem> = {};

    deliveryOrders.forEach((order) => {
      const key = `${order.customerId}-${order.categoryCode}`;
      if (!grouped[key]) {
        const category = categoryCodeMap[order.categoryCode];
        grouped[key] = {
          customerId: order.customerId,
          customerName: order.customer?.name || '',
          categoryCode: order.categoryCode,
          categoryName: category?.name || order.categoryCode,
          totalQuantity: 0,
          totalAmount: 0,
          deliveryCount: 0,
          status: 'unreconciled',
        };
      }

      order.items.forEach((item: any) => {
        grouped[key].totalQuantity += parseFloat(item.quantity || 0);

        const calcQuantity = this.getCalculationQuantity(order.categoryCode, item);
        const contractPrice = parseFloat(item.price || 0);
        grouped[key].totalAmount += calcQuantity * contractPrice;
      });
      grouped[key].deliveryCount++;
    });

    const list = Object.values(grouped).map((item) => ({
      ...item,
      totalQuantity: parseFloat(item.totalQuantity.toFixed(4)),
      totalAmount: parseFloat(item.totalAmount.toFixed(2)),
    }));

    list.sort((a, b) => b.totalAmount - a.totalAmount);

    const total = list.length;
    const paginatedList = list.slice((page - 1) * pageSize, page * pageSize);

    return { list: paginatedList, total, page, pageSize };
  }

  async getCustomerDeliveryDetail(query: ReconciliationQueryDto) {
    const { customerId, startDate, endDate, categoryCode } = query;

    const where: any = {
      customerId: Number(customerId),
      deliveryDate: {
        gte: new Date(startDate),
        lte: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1),
      },
    };

    if (categoryCode) {
      where.categoryCode = categoryCode;
    }

    const deliveryOrders = await this.prisma.deliveryOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, spec: true } },
          },
        },
      },
      orderBy: { deliveryDate: 'asc' },
    });

    // 获取合同价格映射
    const contractPriceMap = await this.getContractPriceMap(Number(customerId));

    const list: CustomerDeliveryDetailItem[] = [];
    const totals: DeliveryDetailTotals = {
      totalQuantity: 0,
      totalAmount: 0,
      deductVolume: 0,
      convertedCubic: 0,
    };

    deliveryOrders.forEach((order) => {
      order.items.forEach((item: any) => {
        const spec = item.product?.spec || '';
        const contractPrice = contractPriceMap[spec] || parseFloat(item.price || 0);
        const calcQuantity = this.getCalculationQuantity(order.categoryCode, item);
        const calculatedAmount = calcQuantity * contractPrice;

        const itemData: CustomerDeliveryDetailItem = {
          deliveryDate: order.deliveryDate.toISOString().split('T')[0],
          quantity: parseFloat(item.quantity || 0).toFixed(4),
          contractPrice: contractPrice.toFixed(2),
          amount: calculatedAmount.toFixed(2),
        };

        // 根据品类添加特定字段
        if (order.categoryCode === 'mortar') {
          const attrs = item.attributes as any || {};
          itemData.supplierName = order.supplier?.name || '';
          itemData.mortarGrade = attrs.mortarGrade || '';
          itemData.packingType = attrs.packingType === 'bulk' ? '散装' : '袋包';
        } else if (order.categoryCode === 'block') {
          const attrs = item.attributes as any || {};
          itemData.deliveryMethod = '厂家直送';
          itemData.deliveryNo = order.no;
          itemData.spec = spec;
          itemData.type = 'S';
          itemData.receivedQuantity = parseFloat(item.quantity || 0).toFixed(4);
          itemData.deduction = '0';
          itemData.convertedCubic = (attrs.convertedCubic || 0).toFixed(4);
          itemData.remarks = attrs.remarks || '';
        }

        list.push(itemData);

        totals.totalQuantity += parseFloat(item.quantity || 0);
        totals.totalAmount += calculatedAmount;

        if (order.categoryCode === 'block') {
          totals.convertedCubic += parseFloat((item.attributes as any)?.convertedCubic || 0);
        }
      });
    });

    return {
      list,
      customerName: deliveryOrders[0]?.customer?.name || '',
      productType: deliveryOrders[0]?.categoryCode || '',
      totals: {
        totalQuantity: parseFloat(totals.totalQuantity.toFixed(4)),
        totalAmount: parseFloat(totals.totalAmount.toFixed(2)),
        deductVolume: parseFloat(totals.deductVolume.toFixed(4)),
        convertedCubic: parseFloat(totals.convertedCubic.toFixed(4)),
      },
    };
  }

  // ============================================
  // 私有辅助方法
  // ============================================

  /**
   * 验证并计算金额
   */
  private validateAndCalcAmount(item: any, categoryCode: string): number {
    const quantity = parseFloat(item.quantity);
    const price = parseFloat(item.price);
    const amount = parseFloat(item.amount);

    if (quantity < -9999.9999 || quantity > 9999.9999) {
      throw new BadRequestException('数量超出允许范围（-9999.9999 ~ 9999.9999）');
    }

    // 根据品类确定验算依据的数量
    let checkQuantity = quantity;
    if (categoryCode === 'block' && item.attributes?.convertedCubic) {
      checkQuantity = parseFloat(item.attributes.convertedCubic);
    }

    const calculated = parseFloat((checkQuantity * price).toFixed(2));
    const diff = Math.abs(calculated - amount);

    if (diff > 0.01) {
      throw new BadRequestException(
        `金额验算失败：数量×单价=${calculated}，实际金额=${amount}，差异过大`
      );
    }

    return amount;
  }

  /**
   * 格式化明细数据
   */
  private formatItemData(item: any) {
    return {
      productId: item.productId || null,
      quantity: item.quantity,
      price: item.price,
      amount: item.amount,
      attributes: item.attributes || {},
    };
  }

  /**
   * 格式化送货单响应
   */
  private formatDeliveryOrder(order: any, categoryCodeMap: any): DeliveryOrderResponseDto {
    const category = categoryCodeMap[order.categoryCode];
    const items: DeliveryOrderItemResponseDto[] = order.items.map((item: any) => ({
      id: item.id,
      deliveryOrderId: order.id,
      productId: item.productId,
      productName: item.product?.name || '',
      productSpec: item.product?.spec || '',
      quantity: parseFloat(item.quantity || 0),
      price: parseFloat(item.price || 0),
      amount: parseFloat(item.amount || 0),
      attributes: (typeof item.attributes === 'string' ? JSON.parse(item.attributes) : item.attributes) || {},
    }));

    return {
      id: order.id,
      no: order.no,
      contractId: order.contractId,
      contractNo: order.contract?.no,
      supplierId: order.supplierId,
      supplierName: order.supplier?.name || '',
      customerId: order.customerId,
      customerName: order.customer?.name || '',
      categoryCode: order.categoryCode,
      categoryName: category?.name || order.categoryCode,
      deliveryDate: order.deliveryDate.toISOString().split('T')[0],
      totalAmount: parseFloat(order.totalAmount || 0),
      status: order.status,
      receiptUrl: order.receiptUrl,
      remark: order.remark,
      deletedAt: order.deletedAt?.toISOString(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items,
    };
  }

  /**
   * 获取计算用的数量（根据品类不同可能使用折立方等）
   */
  private getCalculationQuantity(categoryCode: string, item: any): number {
    if (categoryCode === 'block') {
      return parseFloat((item.attributes as any)?.convertedCubic || item.quantity || 0);
    }
    return parseFloat(item.quantity || 0);
  }

  /**
   * 获取合同价格映射
   */
  private async getContractPriceMap(customerId: number): Promise<Record<string, number>> {
    const contracts = await this.prisma.contract.findMany({
      where: {
        reconciliationUnitId: customerId,
        status: { in: ['active'] },
      },
      include: {
        items: { select: { spec: true, price: true } },
      },
    });

    const priceMap: Record<string, number> = {};
    contracts.forEach((contract) => {
      if (contract.items) {
        contract.items.forEach((item) => {
          if (item.spec) {
            priceMap[item.spec] = parseFloat(item.price.toString());
          }
        });
      }
    });

    return priceMap;
  }

  /**
   * 获取品类名称映射
   */
  private async getCategoryNameMap(): Promise<Record<string, string>> {
    const categories = await this.prisma.productCategory.findMany();
    return Object.fromEntries(categories.map(c => [c.code, c.name]));
  }

  /**
   * 处理导入行数据
   */
  private async processImportRow(row: any, categoryCode: string, rowNum: number, allSuppliers: any[], allCustomers: any[]): Promise<{ error?: string }> {
    const no = row.no || row['送货单号'] || row['送货单号'.trim()];
    const supplierName = row.supplierName || row['供货单位'] || row['供货单位'.trim()];
    const customerName = row.customerName || row['项目名称'] || row['项目名称'.trim()];

    if (!no || !supplierName || !customerName) {
      return { error: '必填字段缺失：送货单号/供货单位/项目名称' };
    }

    const supplier = allSuppliers.find(s =>
      s.name.includes(supplierName) || supplierName.includes(s.name)
    );
    if (!supplier) {
      return { error: `供货单位「${supplierName}」不存在` };
    }

    const customer = allCustomers.find(c => {
      const dbName = c.name;
      const importName = customerName;
      if (dbName.includes(importName) || importName.includes(dbName)) return true;
      const dbChars = dbName.replace(/\s+/g, '');
      const importChars = importName.replace(/\s+/g, '');
      if (dbChars.includes(importChars) || importChars.includes(dbChars)) return true;
      const matchChars = [...importChars].filter(ch => dbChars.includes(ch)).length;
      return matchChars >= Math.min(4, importChars.length * 0.6);
    });
    if (!customer) {
      return { error: `项目「${customerName}」不存在` };
    }

    // 查找合同（可选，零售订单可以没有合同）
    const contract = await this.prisma.contract.findFirst({
      where: {
        reconciliationUnitId: customer.id,
        status: { in: ['active'] },
      },
    });

    // 检查送货单是否已存在
    const existingOrder = await this.prisma.deliveryOrder.findUnique({ where: { no } });
    if (existingOrder) {
      return { error: `送货单号「${no}」已存在` };
    }

    // 解析数据
    const quantity = parseFloat(row.quantity) || 0;
    const price = parseFloat(row.price) || 0;
    const amount = parseFloat(row.amount) || 0;

    // 验证金额
    const calculatedAmount = parseFloat((quantity * price).toFixed(2));
    if (Math.abs(calculatedAmount - amount) > 0.01) {
      return { error: `金额验算失败：数量×单价=${calculatedAmount}，实际金额=${amount}` };
    }

    // 解析日期
    const deliveryDateStr = row.deliveryDate || row['送货日期'] || '';
    const deliveryDate = new Date(deliveryDateStr);
    if (isNaN(deliveryDate.getTime())) {
      return { error: `送货日期「${deliveryDateStr}」无效` };
    }

    // 构建品类专属属性
    const attributes: any = {};
    if (categoryCode === 'mortar') {
      attributes.mortarGrade = row.mortarGrade || '';
      attributes.packingType = row.packingType === '袋包' ? 'bagged' : 'bulk';
      attributes.licensePlate = row.licensePlate || '';
    } else if (categoryCode === 'block') {
      attributes.convertedCubic = parseFloat(row.convertedCubic) || 0;
      attributes.frameTaken = parseInt(row.frameTaken) || 0;
      attributes.frameReturned = parseInt(row.frameReturned) || 0;
      attributes.remarks = row.remarks || '';
    }

    // 创建送货单
    await this.prisma.deliveryOrder.create({
      data: {
        no,
        contractId: contract.id,
        supplierId: supplier.id,
        customerId: customer.id,
        categoryCode,
        deliveryDate,
        totalAmount: amount,
        status: 'pending',
        remark: row.remark || '',
        items: {
          create: {
            productId: null,
            quantity,
            price,
            amount,
            attributes,
          },
        },
      },
    });

    return {};
  }

  /**
   * 格式化对账明细项
   */
  private formatDetailItem(order: any, item: any, contractPriceMap: Record<string, number>): SupplierDeliveryDetailItem {
    const spec = item.product?.spec || '';
    const contractPrice = contractPriceMap[spec] || parseFloat(item.price || 0);
    const attrs = item.attributes as any || {};

    const baseItem = {
      deliveryDate: order.deliveryDate.toISOString().split('T')[0],
      deliveryNo: order.no,
      spec,
      price: parseFloat(item.price || 0).toFixed(2),
      contractPrice: contractPrice.toFixed(2),
      remark: '',
    };

    if (order.categoryCode === 'mortar') {
      return {
        ...baseItem,
        deliveryMethod: attrs.packingType === 'bulk' ? '散装' : '袋装',
        type: '砂浆',
        quantity: parseFloat(item.quantity || 0).toFixed(4),
        receivedQuantity: parseFloat(item.quantity || 0).toFixed(4),
        deduction: '0',
        convertedCubic: '0',
        amount: parseFloat(item.amount || 0).toFixed(2),
        customerName: order.customer?.name || '',
        mortarGrade: attrs.mortarGrade || '',
        packingType: attrs.packingType || '',
      };
    } else {
      const convertedCubic = parseFloat(attrs.convertedCubic || 0);
      return {
        ...baseItem,
        deliveryMethod: '厂家直送',
        type: 'S',
        quantity: parseFloat(item.quantity || 0).toFixed(4),
        receivedQuantity: parseFloat(item.quantity || 0).toFixed(4),
        deduction: '0',
        convertedCubic: convertedCubic.toFixed(4),
        amount: (convertedCubic * contractPrice).toFixed(2),
        remark: attrs.remarks || '',
      };
    }
  }
}
