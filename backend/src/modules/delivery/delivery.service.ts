import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { no, productType, status } = query;
    const where: any = { deletedAt: null };
    if (no) where.no = { contains: no };
    if (productType) where.productType = productType;
    if (status) where.status = status;

    const [list, total] = await Promise.all([
      this.prisma.deliveryOrder.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
        include: {
          supplier: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
          mortarItems: true,
          blockItems: true,
        },
      }),
      this.prisma.deliveryOrder.count({ where }),
    ]);

    const formatted = list.map((item: any) => {
      const items = item.productType === 'mortar' ? item.mortarItems : item.blockItems;
      const primaryItem = items?.[0] || {};
      return {
        ...item,
        supplierId: item.supplier?.id,
        supplierName: item.supplier?.name,
        customerId: item.customer?.id,
        customerName: item.customer?.name,
        items,
        primaryItem,
      };
    });

    return { list: formatted, total, page, pageSize };
  }

  async findOne(id: number) {
    const order = await this.prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        contract: { select: { id: true, no: true } },
        mortarItems: { include: { product: { select: { id: true, name: true, spec: true } } } },
        blockItems: { include: { product: { select: { id: true, name: true, spec: true } } } },
      },
    });
    if (!order) throw new NotFoundException('送货单不存在');
    const items = order.productType === 'mortar' ? order.mortarItems : order.blockItems;
    return {
      ...order,
      supplierId: order.supplier?.id,
      supplierName: order.supplier?.name,
      customerId: order.customer?.id,
      customerName: order.customer?.name,
      contractId: order.contract?.id,
      contractNo: order.contract?.no,
      items,
    };
  }

  private validateAmount(quantity: number, price: number, amount: number): void {
    const calculated = parseFloat((quantity * price).toFixed(2));
    const diff = Math.abs(calculated - amount);
    if (diff > 0.01) {
      throw new BadRequestException(`金额验算失败：数量×单价=${calculated}，实际金额=${amount}，差异过大`);
    }
  }

  private validateQuantity(quantity: number): void {
    if (quantity < -9999.9999 || quantity > 9999.9999) {
      throw new BadRequestException('数量超出允许范围（-9999.9999 ~ 9999.9999）');
    }
  }

  async create(data: any) {
    const no = `SHD-${Date.now()}`;
    const { items, customerName, supplierName, contractItems, ...orderData } = data;

    if (!orderData.productType || !['mortar', 'block'].includes(orderData.productType)) {
      throw new BadRequestException('产品类型必须是 mortar 或 block');
    }

    if (orderData.deliveryDate && typeof orderData.deliveryDate === 'string') {
      orderData.deliveryDate = new Date(orderData.deliveryDate);
    }

    const totalAmount = items?.reduce((sum: number, item: any) => sum + parseFloat(item.amount || 0), 0) || 0;

    const createData: any = {
      no,
      totalAmount,
      productType: orderData.productType,
      deliveryDate: orderData.deliveryDate,
      status: orderData.status || 'pending',
      remark: orderData.remark || '',
      supplier: { connect: { id: orderData.supplierId } },
      customer: { connect: { id: orderData.customerId } },
    };

    if (orderData.contractId) {
      createData.contract = { connect: { id: orderData.contractId } };
    }

    const itemField = orderData.productType === 'mortar' ? 'mortarItems' : 'blockItems';
    createData[itemField] = {
      create: items?.map((item: any) => {
        this.validateQuantity(item.quantity);
        if (orderData.productType === 'mortar') {
          this.validateAmount(item.quantity, item.price, item.amount);
          return {
            quantity: item.quantity,
            price: item.price,
            amount: item.amount,
            mortarGrade: item.mortarGrade || '',
            packingType: item.packingType || '',
            licensePlate: item.licensePlate || '',
            ...(item.productId ? { product: { connect: { id: item.productId } } } : {}),
          };
        } else {
          this.validateAmount(item.convertedCubic, item.price, item.amount);
          return {
            quantity: item.quantity,
            price: item.price,
            amount: item.amount,
            convertedCubic: item.convertedCubic || 0,
            frameTaken: item.frameTaken || 0,
            frameReturned: item.frameReturned || 0,
            remarks: item.remarks || '',
            ...(item.productId ? { product: { connect: { id: item.productId } } } : {}),
          };
        }
      }) || [],
    };

    return this.prisma.deliveryOrder.create({
      data: createData as any,
      include: {
        mortarItems: true,
        blockItems: true,
      },
    });
  }

  async update(id: number, data: any) {
    const existing = await this.findOne(id);
    const { items, customerName, supplierName, contractItems, ...orderData } = data;

    if (orderData.productType && !['mortar', 'block'].includes(orderData.productType)) {
      throw new BadRequestException('产品类型必须是 mortar 或 block');
    }

    if (orderData.deliveryDate && typeof orderData.deliveryDate === 'string') {
      orderData.deliveryDate = new Date(orderData.deliveryDate);
    }

    const updateData: any = {
      productType: orderData.productType,
      deliveryDate: orderData.deliveryDate,
      status: orderData.status,
      remark: orderData.remark,
      supplier: { connect: { id: orderData.supplierId } },
      customer: { connect: { id: orderData.customerId } },
    };

    if (orderData.contractId) {
      updateData.contract = { connect: { id: orderData.contractId } };
    }

    if (items) {
      const totalAmount = items.reduce((sum: number, item: any) => sum + parseFloat(item.amount || 0), 0);
      updateData.totalAmount = totalAmount;

      const productType = existing.productType;
      if (productType === 'mortar') {
        await this.prisma.deliveryOrderMortar.deleteMany({ where: { deliveryOrderId: id } });
      } else {
        await this.prisma.deliveryOrderBlock.deleteMany({ where: { deliveryOrderId: id } });
      }

      const itemField = productType === 'mortar' ? 'mortarItems' : 'blockItems';
      updateData[itemField] = {
        create: items.map((item: any) => {
          this.validateQuantity(item.quantity);
          if (productType === 'mortar') {
            this.validateAmount(item.quantity, item.price, item.amount);
            return {
              quantity: item.quantity,
              price: item.price,
              amount: item.amount,
              mortarGrade: item.mortarGrade || '',
              packingType: item.packingType || '',
              licensePlate: item.licensePlate || '',
              ...(item.productId ? { product: { connect: { id: item.productId } } } : {}),
            };
          } else {
            this.validateAmount(item.convertedCubic, item.price, item.amount);
            return {
              quantity: item.quantity,
              price: item.price,
              amount: item.amount,
              convertedCubic: item.convertedCubic || 0,
              frameTaken: item.frameTaken || 0,
              frameReturned: item.frameReturned || 0,
              remarks: item.remarks || '',
              ...(item.productId ? { product: { connect: { id: item.productId } } } : {}),
            };
          }
        }),
      };
    }

    return this.prisma.deliveryOrder.update({
      where: { id },
      data: updateData as any,
      include: {
        mortarItems: true,
        blockItems: true,
      },
    });
  }

  async remove(id: number) {
    if (!id || isNaN(id)) throw new BadRequestException('无效的送货单ID');
    return this.prisma.deliveryOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: number) {
    if (!id || isNaN(id)) throw new BadRequestException('无效的送货单ID');
    const order = await this.prisma.deliveryOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('送货单不存在');
    if (!order.deletedAt) throw new BadRequestException('该送货单未被删除，无需恢复');
    return this.prisma.deliveryOrder.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async getDeleted(query: any) {
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
          mortarItems: true,
          blockItems: true,
        },
      }),
      this.prisma.deliveryOrder.count({ where }),
    ]);

    const formatted = list.map((item: any) => {
      const items = item.productType === 'mortar' ? item.mortarItems : item.blockItems;
      return {
        ...item,
        supplierId: item.supplier?.id,
        supplierName: item.supplier?.name,
        customerId: item.customer?.id,
        customerName: item.customer?.name,
        items,
      };
    });

    return { list: formatted, total, page, pageSize };
  }

  async importDeliveryOrders(data: { productType: string; rows: any[] }) {
    const { productType, rows } = data;
    const errors: { row: number; message: string; data: any }[] = [];
    const results: { success: number; failed: number; errors: any[] } = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const no = row.no || row['送货单号'] || row['送货单号'.trim()];
      const supplierName = row.supplierName || row['供货单位'] || row['供货单位'.trim()];
      const customerName = row.customerName || row['项目名称'] || row['项目名称'.trim()];

      try {
        if (!no || !supplierName || !customerName) {
          errors.push({ row: rowNum, message: '必填字段缺失：送货单号/供货单位/项目名称', data: row });
          continue;
        }

        const allSuppliers = await this.prisma.customer.findMany({
        where: { type: 'supplier' }
      });
      const supplier = allSuppliers.find(s =>
        s.name.includes(supplierName) || supplierName.includes(s.name)
      );
      if (!supplier) {
        errors.push({ row: rowNum, message: `供货单位「${supplierName}」不存在`, data: row });
        continue;
      }

      const allCustomers = await this.prisma.customer.findMany({
        where: { type: 'project' }
      });
      const customer = allCustomers.find(c => {
        const dbName = c.name;
        const importName = customerName;
        if (dbName.includes(importName) || importName.includes(dbName)) return true;
        const dbChars = dbName.replace(/\s+/g, '');
        const importChars = importName.replace(/\s+/g, '');
        if (dbChars.includes(importChars) || importChars.includes(dbChars)) return true;
        const importLen = importChars.length;
        const matchChars = [...importChars].filter(ch => dbChars.includes(ch)).length;
        return matchChars >= Math.min(4, importLen * 0.6);
      });
      if (!customer) {
        errors.push({ row: rowNum, message: `项目「${customerName}」不存在`, data: row });
        continue;
      }

        const contract = await this.prisma.contract.findFirst({
          where: {
            customerId: customer.id,
            type: productType === 'mortar' ? 'downstream' : 'upstream',
            status: { in: ['confirmed', 'active'] }
          }
        });
        if (!contract) {
          errors.push({ row: rowNum, message: `项目「${customerName}」没有对应的${productType === 'mortar' ? '下游' : '上游'}合同`, data: row });
          continue;
        }

        const existingOrder = await this.prisma.deliveryOrder.findUnique({ where: { no } });
        if (existingOrder) {
          errors.push({ row: rowNum, message: `送货单号「${no}」已存在`, data: row });
          continue;
        }

        const quantity = parseFloat(row.quantity) || 0;
        const price = parseFloat(row.price) || 0;
        const amount = parseFloat(row.amount) || 0;
        const calculatedAmount = parseFloat((quantity * price).toFixed(2));

        if (Math.abs(calculatedAmount - amount) > 0.01) {
          errors.push({ row: rowNum, message: `金额验算失败：数量×单价=${calculatedAmount}，实际金额=${amount}`, data: row });
          continue;
        }

        const deliveryDateStr = row.deliveryDate || row['送货日期'] || '';
        const deliveryDate = new Date(deliveryDateStr);
        if (isNaN(deliveryDate.getTime())) {
          errors.push({ row: rowNum, message: `送货日期「${deliveryDateStr}」无效`, data: row });
          continue;
        }

        if (productType === 'mortar') {
          await this.prisma.deliveryOrder.create({
            data: {
              no,
              contractId: contract.id,
              supplierId: supplier.id,
              customerId: customer.id,
              productType: 'mortar',
              deliveryDate,
              totalAmount: amount,
              status: 'pending',
              remark: row.remark || '',
              mortarItems: {
                create: {
                  productId: null,
                  quantity,
                  price,
                  amount,
                  mortarGrade: row.mortarGrade || '',
                  packingType: row.packingType === '袋包' ? 'bagged' : 'bulk',
                  licensePlate: row.licensePlate || ''
                }
              }
            }
          });
        } else {
          const convertedCubic = parseFloat(row.convertedCubic) || 0;
          const frameTaken = parseInt(row.frameTaken) || 0;
          const frameReturned = parseInt(row.frameReturned) || 0;

          await this.prisma.deliveryOrder.create({
            data: {
              no,
              contractId: contract.id,
              supplierId: supplier.id,
              customerId: customer.id,
              productType: 'block',
              deliveryDate,
              totalAmount: amount,
              status: 'pending',
              remark: row.remark || '',
              blockItems: {
                create: {
                  productId: null,
                  quantity,
                  convertedCubic,
                  price,
                  amount,
                  frameTaken,
                  frameReturned,
                  remarks: row.remarks || ''
                }
              }
            }
          });
        }
      } catch (e) {
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

  async getSupplierReconciliation(query: any) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { supplierId, startDate, endDate } = query;

    const where: any = {
      deliveryDate: {
        gte: new Date(startDate),
        lte: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1),
      },
    };

    if (supplierId) {
      where.supplierId = Number(supplierId);
    }

    const deliveryOrders = await this.prisma.deliveryOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        mortarItems: { include: { product: { select: { spec: true } } } },
        blockItems: { include: { product: { select: { spec: true } } } },
      },
    });

    const blockSupplierIds = [...new Set(deliveryOrders.filter(o => o.productType === 'block').map(o => o.supplierId))];
    const contracts = blockSupplierIds.length > 0 ? await this.prisma.contract.findMany({
      where: {
        customerId: { in: blockSupplierIds },
        type: 'upstream',
        status: { in: ['confirmed', 'active'] },
      },
      include: {
        items: { select: { spec: true, price: true } },
      },
    }) : [];

    const contractPriceMap: Record<string, Record<string, number>> = {};
    contracts.forEach((contract) => {
      if (!contractPriceMap[contract.customerId]) {
        contractPriceMap[contract.customerId] = {};
      }
      contract.items.forEach((item) => {
        if (item.spec) {
          contractPriceMap[contract.customerId][item.spec] = parseFloat(item.price.toString());
        }
      });
    });

    const grouped: Record<number, { supplierId: number; supplierName: string; productType: string; totalQuantity: number; totalAmount: number; deliveryCount: number }> = {};

    deliveryOrders.forEach((order) => {
      const key = `${order.supplierId}-${order.productType}`;
      if (!grouped[key]) {
        grouped[key] = {
          supplierId: order.supplierId,
          supplierName: order.supplier?.name || '',
          productType: order.productType,
          totalQuantity: 0,
          totalAmount: 0,
          deliveryCount: 0,
        };
      }

      const items = order.productType === 'mortar' ? order.mortarItems : order.blockItems;
      items.forEach((item: any) => {
        grouped[key].totalQuantity += parseFloat(item.quantity || 0);
        
        if (order.productType === 'mortar') {
          grouped[key].totalAmount += parseFloat(item.amount || 0);
        } else {
          const spec = item.product?.spec || '';
          const supplierPrices = contractPriceMap[order.supplierId] || {};
          const contractPrice = supplierPrices[spec] || parseFloat(item.price || 0);
          const convertedCubic = parseFloat(item.convertedCubic || 0);
          grouped[key].totalAmount += convertedCubic * contractPrice;
        }
      });
      grouped[key].deliveryCount++;
    });

    const list = Object.values(grouped).map((item) => ({
      ...item,
      totalQuantity: parseFloat(item.totalQuantity.toFixed(4)),
      totalAmount: parseFloat(item.totalAmount.toFixed(2)),
      status: 'unreconciled' as const,
    }));

    list.sort((a, b) => b.totalAmount - a.totalAmount);

    const total = list.length;
    const paginatedList = list.slice((page - 1) * pageSize, page * pageSize);

    return { list: paginatedList, total, page, pageSize };
  }

  async getSupplierDeliveryDetail(query: any) {
    const { supplierId, startDate, endDate, productType } = query;

    const where: any = {
      supplierId: Number(supplierId),
      deliveryDate: {
        gte: new Date(startDate),
        lte: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1),
      },
    };

    if (productType) {
      where.productType = productType;
    }

    const deliveryOrders = await this.prisma.deliveryOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        mortarItems: { include: { product: { select: { id: true, name: true, spec: true } } } },
        blockItems: { include: { product: { select: { id: true, name: true, spec: true } } } },
      },
      orderBy: { deliveryDate: 'asc' },
    });

    console.log('=== 合同查询日志 ===');
    console.log('supplierId:', supplierId);

    const supplier = await this.prisma.customer.findUnique({
      where: { id: Number(supplierId) },
      select: { id: true, name: true },
    });
    console.log('厂家信息:', supplier);

    const contracts = await this.prisma.contract.findMany({
      where: {
        customerId: Number(supplierId),
        type: 'upstream',
        status: { in: ['confirmed', 'active'] },
      },
      include: {
        customer: { select: { id: true, name: true } },
        items: { select: { spec: true, price: true } },
      },
    });

    console.log('查询到的厂家合同数量:', contracts.length);
    contracts.forEach((contract, index) => {
      console.log(`合同${index + 1}: no=${contract.no}, id=${contract.id}, status=${contract.status}, customerName=${contract.customer?.name}`);
      console.log(`合同项目:`);
      contract.items.forEach((item) => {
        console.log(`  - spec="${item.spec}", price=${item.price}`);
      });
    });

    if (contracts.length === 0) {
      console.log('警告：未找到厂家的合同，尝试查询所有上游合同...');
      const allBlockContracts = await this.prisma.contract.findMany({
        where: {
          type: 'upstream',
          status: { in: ['confirmed', 'active'] },
        },
        include: {
          customer: { select: { id: true, name: true } },
          items: { select: { spec: true, price: true } },
        },
      });
      console.log('所有上游合同数量:', allBlockContracts.length);
      allBlockContracts.forEach((contract, index) => {
        console.log(`合同${index + 1}: no=${contract.no}, customerId=${contract.customerId}, customerName=${contract.customer?.name}`);
      });
    }

    const contractPriceMap: Record<string, number> = {};
    contracts.forEach((contract) => {
      contract.items.forEach((item) => {
        if (item.spec) {
          contractPriceMap[item.spec] = parseFloat(item.price.toString());
        }
      });
    });

    console.log('构建的价格映射:', contractPriceMap);

    const list: any[] = [];

    deliveryOrders.forEach((order) => {
      const items = order.productType === 'mortar' ? order.mortarItems : order.blockItems;

      items.forEach((item: any) => {
        if (order.productType === 'mortar') {
          list.push({
            deliveryDate: order.deliveryDate.toISOString().split('T')[0],
            deliveryMethod: item.packingType === 'bulk' ? '散装' : '袋装',
            deliveryNo: order.no,
            spec: item.product?.spec || '',
            type: '砂浆',
            quantity: parseFloat(item.quantity || 0).toFixed(4),
            receivedQuantity: parseFloat(item.quantity || 0).toFixed(4),
            deduction: '0',
            convertedCubic: '0',
            amount: parseFloat(item.amount || 0).toFixed(2),
            remark: order.remark || '',
            customerName: order.customer?.name || '',
            mortarGrade: item.mortarGrade || '',
            packingType: item.packingType || '',
            price: parseFloat(item.price || 0).toFixed(2),
          });
        } else {
          const spec = item.product?.spec || '';
          const foundInContract = spec in contractPriceMap;
          const contractPrice = foundInContract ? contractPriceMap[spec] : parseFloat(item.price || 0);
          const convertedCubic = parseFloat(item.convertedCubic || 0);
          const calculatedAmount = (convertedCubic * contractPrice).toFixed(2);

          console.log(`处理送货单 ${order.no}, 规格: "${spec}"`);
          console.log(`  - 在合同中找到: ${foundInContract}`);
          console.log(`  - 合同单价: ${foundInContract ? contractPriceMap[spec] : '未找到'}`);
          console.log(`  - 送货单单价: ${item.price}`);
          console.log(`  - 使用的单价: ${contractPrice}`);

          list.push({
            deliveryDate: order.deliveryDate.toISOString().split('T')[0],
            deliveryMethod: '厂家直送',
            deliveryNo: order.no,
            spec,
            type: 'S',
            quantity: parseFloat(item.quantity || 0).toFixed(4),
            receivedQuantity: parseFloat(item.quantity || 0).toFixed(4),
            deduction: '0',
            convertedCubic: convertedCubic.toFixed(4),
            contractPrice: contractPrice.toFixed(2),
            amount: calculatedAmount,
            remark: item.remarks || '',
          });
        }
      });
    });

    return { list };
  }

  async getCustomerReconciliation(query: any) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { customerId, startDate, endDate } = query;

    const where: any = {
      deliveryDate: {
        gte: new Date(startDate),
        lte: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1),
      },
    };

    if (customerId) {
      where.customerId = Number(customerId);
    }

    const deliveryOrders = await this.prisma.deliveryOrder.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        mortarItems: { include: { product: { select: { spec: true } } } },
        blockItems: { include: { product: { select: { spec: true } } } },
      },
    });

    const customerIds = [...new Set(deliveryOrders.map(o => o.customerId))];
    const contracts = customerIds.length > 0 ? await this.prisma.contract.findMany({
      where: {
        customerId: { in: customerIds },
        type: 'downstream',
        status: { in: ['confirmed', 'active'] },
      },
      include: {
        items: { select: { spec: true, price: true } },
      },
    }) : [];

    const contractPriceMap: Record<string, Record<string, number>> = {};
    contracts.forEach((contract) => {
      if (!contractPriceMap[contract.customerId]) {
        contractPriceMap[contract.customerId] = {};
      }
      contract.items.forEach((item) => {
        if (item.spec) {
          contractPriceMap[contract.customerId][item.spec] = parseFloat(item.price.toString());
        }
      });
    });

    const grouped: Record<string, { customerId: number; customerName: string; productType: string; totalQuantity: number; totalAmount: number; deliveryCount: number }> = {};

    deliveryOrders.forEach((order) => {
      const key = `${order.customerId}-${order.productType}`;
      if (!grouped[key]) {
        grouped[key] = {
          customerId: order.customerId,
          customerName: order.customer?.name || '',
          productType: order.productType,
          totalQuantity: 0,
          totalAmount: 0,
          deliveryCount: 0,
        };
      }

      const items = order.productType === 'mortar' ? order.mortarItems : order.blockItems;
      items.forEach((item: any) => {
        grouped[key].totalQuantity += parseFloat(item.quantity || 0);
        
        if (order.productType === 'mortar') {
          const spec = item.product?.spec || '';
          const customerPrices = contractPriceMap[order.customerId] || {};
          const contractPrice = customerPrices[spec] || parseFloat(item.price || 0);
          grouped[key].totalAmount += parseFloat(item.quantity || 0) * contractPrice;
        } else {
          const spec = item.product?.spec || '';
          const customerPrices = contractPriceMap[order.customerId] || {};
          const contractPrice = customerPrices[spec] || parseFloat(item.price || 0);
          const convertedCubic = parseFloat(item.convertedCubic || 0);
          grouped[key].totalAmount += convertedCubic * contractPrice;
        }
      });
      grouped[key].deliveryCount++;
    });

    const list = Object.values(grouped).map((item) => ({
      ...item,
      totalQuantity: parseFloat(item.totalQuantity.toFixed(4)),
      totalAmount: parseFloat(item.totalAmount.toFixed(2)),
      status: 'unreconciled' as const,
    }));

    list.sort((a, b) => b.totalAmount - a.totalAmount);

    const total = list.length;
    const paginatedList = list.slice((page - 1) * pageSize, page * pageSize);

    return { list: paginatedList, total, page, pageSize };
  }

  async getCustomerDeliveryDetail(query: any) {
    const { customerId, startDate, endDate, productType } = query;

    const where: any = {
      customerId: Number(customerId),
      deliveryDate: {
        gte: new Date(startDate),
        lte: new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1),
      },
    };

    if (productType) {
      where.productType = productType;
    }

    const deliveryOrders = await this.prisma.deliveryOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        mortarItems: { include: { product: { select: { id: true, name: true, spec: true } } } },
        blockItems: { include: { product: { select: { id: true, name: true, spec: true } } } },
      },
      orderBy: { deliveryDate: 'asc' },
    });

    const contracts = await this.prisma.contract.findMany({
      where: {
        customerId: Number(customerId),
        type: 'downstream',
        status: { in: ['confirmed', 'active'] },
      },
      include: {
        items: { select: { spec: true, price: true } },
      },
    });

    const contractPriceMap: Record<string, number> = {};
    contracts.forEach((contract) => {
      contract.items.forEach((item) => {
        if (item.spec) {
          contractPriceMap[item.spec] = parseFloat(item.price.toString());
        }
      });
    });

    const list: any[] = [];
    let totalQuantity = 0;
    let totalAmount = 0;
    let totalDeductVolume = 0;
    let totalConvertedCubic = 0;

    deliveryOrders.forEach((order) => {
      const items = order.productType === 'mortar' ? order.mortarItems : order.blockItems;
      
      items.forEach((item: any) => {
        const spec = item.product?.spec || '';
        const contractPrice = contractPriceMap[spec] || parseFloat(item.price || 0);
        
        if (order.productType === 'mortar') {
          const quantity = parseFloat(item.quantity || 0);
          const calculatedAmount = (quantity * contractPrice).toFixed(2);
          
          list.push({
            deliveryDate: order.deliveryDate.toISOString().split('T')[0],
            supplierName: order.supplier?.name || '',
            mortarGrade: item.mortarGrade || '',
            packingType: item.packingType || '',
            quantity: quantity.toFixed(4),
            contractPrice: contractPrice.toFixed(2),
            amount: calculatedAmount,
          });
          
          totalQuantity += quantity;
          totalAmount += parseFloat(calculatedAmount);
        } else {
          const convertedCubic = parseFloat(item.convertedCubic || 0);
          const calculatedAmount = (convertedCubic * contractPrice).toFixed(2);
          
          list.push({
            deliveryDate: order.deliveryDate.toISOString().split('T')[0],
            deliveryMethod: '厂家直送',
            deliveryNo: order.no,
            spec,
            type: 'S',
            quantity: parseFloat(item.quantity || 0).toFixed(4),
            receivedQuantity: parseFloat(item.quantity || 0).toFixed(4),
            deduction: '0',
            convertedCubic: convertedCubic.toFixed(4),
            contractPrice: contractPrice.toFixed(2),
            amount: calculatedAmount,
            remark: item.remarks || '',
          });
          
          totalQuantity += parseFloat(item.quantity || 0);
          totalAmount += parseFloat(calculatedAmount);
          totalConvertedCubic += convertedCubic;
        }
      });
    });

    return { 
      list, 
      customerName: deliveryOrders[0]?.customer?.name || '',
      productType: deliveryOrders[0]?.productType || '',
      totals: {
        totalQuantity: parseFloat(totalQuantity.toFixed(4)),
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        deductVolume: parseFloat(totalDeductVolume.toFixed(4)),
        convertedCubic: parseFloat(totalConvertedCubic.toFixed(4)),
      }
    };
  }
}
