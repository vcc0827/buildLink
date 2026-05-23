import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { no, projectId, supplierId, date, productName, status } = query;
    
    const where: any = { deletedAt: null };
    if (no) where.no = { contains: no };
    if (projectId) where.projectId = +projectId;
    if (supplierId) where.supplierId = +supplierId;
    if (status) where.status = status;
    if (date) where.date = { gte: new Date(date), lt: new Date(new Date(date).getTime() + 86400000) };
    if (productName) {
      where.items = { some: { productName: { contains: productName } } };
    }

    const [list, total] = await Promise.all([
      this.prisma.deliveryOrder.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
        include: {
          project: true,
          supplier: true,
          items: true,
        },
      }),
      this.prisma.deliveryOrder.count({ where }),
    ]);

    const formatted = list.map((item: any) => ({
      ...item,
      projectName: item.project?.name,
      supplierName: item.supplier?.name,
      date: item.date,
    }));

    return { list: formatted, total, page, pageSize };
  }

  async findOne(id: number) {
    const order = await this.prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        project: true,
        supplier: true,
        items: true,
      },
    });

    if (!order) throw new NotFoundException('送货单不存在');

    return {
      ...order,
      projectName: order.project?.name,
      supplierName: order.supplier?.name,
    };
  }

  async create(data: any) {
    const { items, ...orderData } = data;

    // 生成单号
    const no = await this.generateNo();

    // 计算总金额（采购和销售的）
    const purchaseTotal = items?.reduce((sum: number, item: any) => sum + Number(item.purchaseAmount || 0), 0) || 0;
    const salesTotal = items?.reduce((sum: number, item: any) => sum + Number(item.salesAmount || 0), 0) || 0;

    const order = await this.prisma.deliveryOrder.create({
      data: {
        ...orderData,
        no,
        purchaseTotal,
        salesTotal,
        items: items ? {
          create: items.map((item: any) => ({
            productName: item.productName,
            spec: item.spec || '',
            mortarTonnage: item.mortarTonnage ? Number(item.mortarTonnage) : null,
            packingType: item.packingType || '',
            blockQuantity: item.blockQuantity ? Number(item.blockQuantity) : null,
            receivedQuantity: item.receivedQuantity ? Number(item.receivedQuantity) : null,
            cubicMeter: item.cubicMeter ? Number(item.cubicMeter) : null,
            purchaseUnitPrice: Number(item.purchaseUnitPrice || 0),
            purchaseAmount: Number(item.purchaseAmount || 0),
            salesUnitPrice: Number(item.salesUnitPrice || 0),
            salesAmount: Number(item.salesAmount || 0),
            frameTaken: Number(item.frameTaken || 0),
            frameReturned: Number(item.frameReturned || 0),
            remark: item.remark || '',
          })),
        } : undefined,
      },
      include: {
        project: true,
        supplier: true,
        items: true,
      },
    });

    return {
      ...order,
      projectName: order.project?.name,
      supplierName: order.supplier?.name,
    };
  }

  async update(id: number, data: any) {
    const { items, ...orderData } = data;

    // 检查送货单是否存在
    const existing = await this.prisma.deliveryOrder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('送货单不存在');

    // 计算总金额
    const purchaseTotal = items?.reduce((sum: number, item: any) => sum + Number(item.purchaseAmount || 0), 0) || 0;
    const salesTotal = items?.reduce((sum: number, item: any) => sum + Number(item.salesAmount || 0), 0) || 0;

    // 更新主表
    const order = await this.prisma.deliveryOrder.update({
      where: { id },
      data: {
        ...orderData,
        purchaseTotal,
        salesTotal,
      },
    });

    // 更新明细表
    if (items) {
      // 删除旧明细
      await this.prisma.deliveryOrderItem.deleteMany({
        where: { deliveryOrderId: id },
      });

      // 创建新明细
      await this.prisma.deliveryOrderItem.createMany({
        data: items.map((item: any) => ({
          deliveryOrderId: id,
          productName: item.productName,
          spec: item.spec || '',
          mortarTonnage: item.mortarTonnage ? Number(item.mortarTonnage) : null,
          packingType: item.packingType || '',
          blockQuantity: item.blockQuantity ? Number(item.blockQuantity) : null,
          receivedQuantity: item.receivedQuantity ? Number(item.receivedQuantity) : null,
          cubicMeter: item.cubicMeter ? Number(item.cubicMeter) : null,
          purchaseUnitPrice: Number(item.purchaseUnitPrice || 0),
          purchaseAmount: Number(item.purchaseAmount || 0),
          salesUnitPrice: Number(item.salesUnitPrice || 0),
          salesAmount: Number(item.salesAmount || 0),
          frameTaken: Number(item.frameTaken || 0),
          frameReturned: Number(item.frameReturned || 0),
          remark: item.remark || '',
        })),
      });
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.prisma.deliveryOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: '删除成功' };
  }

  async getProductNames() {
    const items = await this.prisma.deliveryOrderItem.findMany({
      where: { productName: { not: null } },
      select: { productName: true },
      distinct: ['productName'],
    });
    return items.map(item => item.productName).filter(Boolean).sort();
  }

  async getCustomerList() {
    const customers = await this.prisma.customer.findMany({
      where: { type: 'project', status: 'active' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return customers;
  }

  async getSupplierList() {
    const suppliers = await this.prisma.customer.findMany({
      where: { type: 'supplier', status: 'active' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return suppliers;
  }

  async calculatePrices(supplierId: number, projectId: number, items: any[]) {
    // 获取供应商的采购合同
    const purchaseContracts = await this.prisma.contract.findMany({
      where: {
        reconciliationUnitId: supplierId,
        type: 'upstream',
        status: 'active',
      },
      include: { items: true },
    });

    // 获取项目的销售合同
    const salesContracts = await this.prisma.contract.findMany({
      where: {
        reconciliationUnitId: projectId,
        type: 'downstream',
        status: 'active',
      },
      include: { items: true },
    });

    const result = items.map((item: any) => {
      const productName = item.productName;
      let purchaseUnitPrice = Number(item.purchaseUnitPrice || 0);
      let salesUnitPrice = Number(item.salesUnitPrice || 0);

      // 从采购合同中查找价格
      for (const contract of purchaseContracts) {
        const contractItem = contract.items.find(
          ci => ci.productName === productName
        );
        if (contractItem && purchaseUnitPrice === 0) {
          purchaseUnitPrice = Number(contractItem.price);
          break;
        }
      }

      // 从销售合同中查找价格
      for (const contract of salesContracts) {
        const contractItem = contract.items.find(
          ci => ci.productName === productName
        );
        if (contractItem && salesUnitPrice === 0) {
          salesUnitPrice = Number(contractItem.price);
          break;
        }
      }

      return {
        ...item,
        purchaseUnitPrice,
        salesUnitPrice,
      };
    });

    return result;
  }

  async importDeliveryOrders(data: any) {
    const { rows, customerMappings, supplierMappings } = data;
    const errors: any[] = [];
    const success: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // 匹配项目
        const projectName = row['送货单位'] || row['送货单位名称'];
        const project = customerMappings.find((c: any) => c.name === projectName);
        if (!project) {
          errors.push({ row: i + 2, message: `未找到项目: ${projectName}` });
          continue;
        }

        // 匹配供应商
        const supplierName = row['供应商'];
        const supplier = supplierMappings.find((s: any) => s.name === supplierName);
        if (!supplier) {
          errors.push({ row: i + 2, message: `未找到供应商: ${supplierName}` });
          continue;
        }

        // 创建送货单
        const order = await this.create({
          date: new Date(row['日期'] || new Date()),
          projectId: project.id,
          supplierId: supplier.id,
          region: row['所属区域'] || '',
          contractBelong: row['合同归属'] || '',
          salesman: row['业务员'] || '',
          driver: row['驾驶员'] || '',
          status: 'pending',
          remark: row['备注'] || '',
          items: [{
            productName: row['品名'] || '',
            spec: row['规格型号'] || '',
            mortarTonnage: row['砂浆送货吨数'] ? Number(row['砂浆送货吨数']) : null,
            packingType: row['砂浆散装/包装'] === '袋包' ? 'bagged' : 'bulk',
            blockQuantity: row['砌块送货数量'] ? Number(row['砌块送货数量']) : null,
            receivedQuantity: row['砌块实收数量'] ? Number(row['砌块实收数量']) : null,
            cubicMeter: row['折立方'] ? Number(row['折立方']) : null,
            purchaseUnitPrice: row['供应商单价'] ? Number(row['供应商单价']) : 0,
            purchaseAmount: row['供应商金额'] ? Number(row['供应商金额']) : 0,
            salesUnitPrice: row['单价'] ? Number(row['单价']) : 0,
            salesAmount: row['金额（元）'] ? Number(row['金额（元）']) : 0,
            frameTaken: row['带去铁架'] ? Number(row['带去铁架']) : 0,
            frameReturned: row['带回铁架'] ? Number(row['带回铁架']) : 0,
          }],
        });

        success.push(order);
      } catch (error: any) {
        errors.push({ row: i + 2, message: error.message });
      }
    }

    return {
      success: success.length,
      failed: errors.length,
      errors,
    };
  }

  private async generateNo() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const prefix = `SH${year}-${month}-${day}-`;

    // 查找今天最大的序号
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const lastOrder = await this.prisma.deliveryOrder.findFirst({
      where: {
        no: { startsWith: prefix },
        createdAt: { gte: startOfDay, lt: endOfDay },
      },
      orderBy: { no: 'desc' },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.no.split('-').pop() || '0');
      sequence = lastSeq + 1;
    }

    return `${prefix}${sequence}`;
  }
}
