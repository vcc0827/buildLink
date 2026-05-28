import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const { no, status, supplierId, customerId, categoryCode } = query;
    
    const where: any = {};
    if (no) where.no = { contains: no };
    if (status) where.status = status;
    if (supplierId) where.supplierId = Number(supplierId);
    if (customerId) where.customerId = Number(customerId);
    if (categoryCode) where.categoryCode = categoryCode;

    const [list, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
        include: {
          supplier: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
          items: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    const formatted = list.map((item: any) => ({
      ...item,
      supplierName: item.supplier?.name,
      customerName: item.customer?.name,
    }));

    return { list: formatted, total, page, pageSize };
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        contract: { select: { id: true, no: true, name: true } },
        items: true,
      },
    });
    if (!order) throw new NotFoundException('报货单不存在');
    return {
      ...order,
      supplierName: order.supplier?.name,
      customerName: order.customer?.name,
    };
  }

  async create(data: any) {
    const { items, ...orderData } = data;
    
    // 生成报货单号
    const now = new Date();
    const orderNo = `ORDER-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Date.now()).slice(-4)}`;

    // 计算总数量
    let totalQuantity = 0;
    items.forEach((item: any) => {
      totalQuantity += Number(item.quantity) || 0;
    });

    const order = await this.prisma.order.create({
      data: {
        no: orderNo,
        supplierId: Number(orderData.supplierId),
        customerId: Number(orderData.customerId),
        categoryCode: orderData.categoryCode,
        planDeliveryDate: new Date(orderData.planDeliveryDate),
        totalQuantity,
        remark: orderData.remark,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId ? Number(item.productId) : null,
            productName: item.productName,
            unit: item.unit,
            model: item.model,
            spec: item.spec,
            quantity: Number(item.quantity),
            price: Number(item.price) || 0,
            amount: Number(item.amount) || 0,
            remark: item.remark,
          })),
        },
        contractId: orderData.contractId ? Number(orderData.contractId) : undefined,
      },
      include: { items: true },
    });

    return order;
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    const { items, ...orderData } = data;

    // 计算总数量
    let totalQuantity = 0;
    if (items) {
      items.forEach((item: any) => {
        totalQuantity += Number(item.quantity) || 0;
      });
    }

    const updateData: any = {
      totalQuantity,
    };

    if (orderData.supplierId !== undefined) updateData.supplierId = Number(orderData.supplierId);
    if (orderData.customerId !== undefined) updateData.customerId = Number(orderData.customerId);
    if (orderData.categoryCode !== undefined) updateData.categoryCode = orderData.categoryCode;
    if (orderData.planDeliveryDate !== undefined) updateData.planDeliveryDate = new Date(orderData.planDeliveryDate);
    if (orderData.remark !== undefined) updateData.remark = orderData.remark;

    // 更新明细
    if (items) {
      await this.prisma.orderItem.deleteMany({ where: { orderId: id } });
      updateData.items = {
        create: items.map((item: any) => ({
          productId: item.productId ? Number(item.productId) : null,
          productName: item.productName,
          unit: item.unit,
          model: item.model,
          spec: item.spec,
          quantity: Number(item.quantity),
          price: Number(item.price) || 0,
          amount: Number(item.amount) || 0,
          remark: item.remark,
        })),
      };
    }

    return this.prisma.order.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });
  }

  async remove(id: number) {
    const order = await this.findOne(id);
    
    if (order.status === 'delivered') {
      throw new Error('已发货的报货单无法删除');
    }

    return this.prisma.order.delete({ where: { id } });
  }

  async cancel(id: number) {
    const order = await this.findOne(id);
    
    if (order.status === 'delivered') {
      throw new Error('已发货的报货单无法取消');
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  async createDelivery(orderId: number, data: any) {
    const order = await this.findOne(orderId);
    
    if (order.status === 'delivered') {
      throw new Error('该报货单已发货');
    }

    // 生成送货单号
    const now = new Date();
    const deliveryNo = `DEL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Date.now()).slice(-4)}`;

    // 计算总金额
    let totalAmount = 0;
    data.items.forEach((item: any) => {
      totalAmount += Number(item.amount) || 0;
    });

    const deliveryOrder = await this.prisma.deliveryOrder.create({
      data: {
        no: deliveryNo,
        supplierId: order.supplierId,
        customerId: order.customerId,
        categoryCode: order.categoryCode,
        deliveryDate: new Date(data.deliveryDate || now),
        totalAmount,
        status: 'pending',
        remark: data.remark || `由报货单 ${order.no} 生成`,
        contractId: order.contractId,
        items: {
          create: data.items.map((item: any) => ({
            productId: item.productId ? Number(item.productId) : null,
            quantity: Number(item.quantity),
            price: Number(item.price) || 0,
            amount: Number(item.amount) || 0,
            attributes: item.attributes || null,
          })),
        },
      },
      include: { items: true },
    });

    // 更新报货单状态为已发货
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'delivered' },
    });

    return deliveryOrder;
  }
}
