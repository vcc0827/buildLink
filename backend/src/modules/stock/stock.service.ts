import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  // 生成库存记录编号
  private generateNo(): string {
    const timestamp = Date.now().toString().slice(-10);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `KC-${timestamp}-${random}`;
  }

  // 计算单价
  private calculateUnitPrice(amount: number, quantity: number): number {
    if (quantity === 0) return 0;
    return Number((amount / quantity).toFixed(4));
  }

  // 计算税额和价税合计
  private calculateTax(amount: number, taxRate: number): { taxAmount: number; totalAmount: number } {
    const taxAmount = Number((amount * taxRate).toFixed(2));
    const totalAmount = Number((amount + taxAmount).toFixed(2));
    return { taxAmount, totalAmount };
  }

  // 获取库存记录列表
  async findAll(query: any) {
    const { month, unit, product, type, page = 1, pageSize = 10 } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    
    if (month) where.month = month;
    if (type) where.type = type;
    
    // 按单位筛选（同时匹配购买方和销售方）
    if (unit) {
      where.OR = [
        { buyer: { name: { contains: unit } } },
        { seller: { name: { contains: unit } } }
      ];
    }
    
    // 按产品筛选
    if (product) {
      where.OR = where.OR || [];
      where.OR.push(
        { product: { name: { contains: product } } },
        { product: { model: { contains: product } } }
      );
    }

    const [data, total] = await Promise.all([
      this.prisma.stockRecord.findMany({
        where,
        include: {
          buyer: { select: { id: true, name: true, type: true } },
          seller: { select: { id: true, name: true, type: true } },
          product: { select: { id: true, name: true, model: true, spec: true, unit: true } }
        },
        orderBy: { date: 'desc' },
        skip,
        take: pageSize
      }),
      this.prisma.stockRecord.count({ where })
    ]);

    return {
      data,
      total,
      page: +page,
      pageSize: +pageSize
    };
  }

  // 获取单条库存记录
  async findOne(id: number) {
    return this.prisma.stockRecord.findUnique({
      where: { id },
      include: {
        buyer: true,
        seller: true,
        product: true
      }
    });
  }

  // 创建库存记录
  async create(data: any) {
    const { date, type, buyerId, sellerId, productId, model, unit, quantity, amount, taxRate = 0, remark } = data;
    
    // 计算月份
    const month = `${new Date(date).getMonth() + 1}月`;
    
    // 计算单价
    const unitPrice = this.calculateUnitPrice(amount, quantity);
    
    // 计算税额和价税合计
    const { taxAmount, totalAmount } = this.calculateTax(amount, taxRate);

    // 获取产品信息（如果有）
    let productUnit = unit;
    let productModel = model;
    if (productId) {
      const product = await this.prisma.product.findUnique({ where: { id: productId } });
      if (product) {
        productUnit = unit || product.unit;
        productModel = model || product.model;
      }
    }

    return this.prisma.stockRecord.create({
      data: {
        no: this.generateNo(),
        date: new Date(date),
        month,
        type,
        buyerId,
        sellerId,
        productId,
        model: productModel,
        unit: productUnit,
        quantity,
        amount,
        unitPrice,
        taxRate,
        taxAmount,
        totalAmount,
        remark
      }
    });
  }

  // 更新库存记录
  async update(id: number, data: any) {
    const { date, type, buyerId, sellerId, productId, model, unit, quantity, amount, taxRate, remark } = data;

    const updateData: any = {};
    
    if (date) {
      updateData.date = new Date(date);
      updateData.month = `${new Date(date).getMonth() + 1}月`;
    }
    if (type) updateData.type = type;
    if (buyerId) updateData.buyerId = buyerId;
    if (sellerId) updateData.sellerId = sellerId;
    if (productId) updateData.productId = productId;
    if (model) updateData.model = model;
    if (unit) updateData.unit = unit;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (amount !== undefined) updateData.amount = amount;
    if (remark) updateData.remark = remark;

    // 如果数量或金额有变化，重新计算单价
    if (quantity !== undefined && amount !== undefined) {
      updateData.unitPrice = this.calculateUnitPrice(amount, quantity);
    }

    // 如果金额或税率有变化，重新计算税额和价税合计
    if ((amount !== undefined || taxRate !== undefined) && amount !== undefined) {
      const rate = taxRate !== undefined ? taxRate : (await this.findOne(id)).taxRate;
      const { taxAmount, totalAmount } = this.calculateTax(amount, rate);
      updateData.taxAmount = taxAmount;
      updateData.totalAmount = totalAmount;
      if (taxRate !== undefined) updateData.taxRate = taxRate;
    }

    return this.prisma.stockRecord.update({
      where: { id },
      data: updateData
    });
  }

  // 删除库存记录
  async remove(id: number) {
    return this.prisma.stockRecord.delete({ where: { id } });
  }

  // 获取库存汇总数据
  async getSummary(query: any = {}) {
    const { month } = query;

    const where: any = {};
    if (month) where.month = month;

    // 获取所有库存记录
    const records = await this.prisma.stockRecord.findMany({
      where,
      include: { product: true }
    });

    // 按产品汇总
    const summaryMap = new Map<string, any>();

    records.forEach(record => {
      const productName = record.product?.name || record.model || '未知产品';
      if (!summaryMap.has(productName)) {
        summaryMap.set(productName, {
          product: productName,
          productId: record.productId,
          totalInQuantity: 0,
          totalInAmount: 0,
          totalOutQuantity: 0,
          totalOutAmount: 0,
          avgUnitPrice: 0,
          balanceQuantity: 0,
          balanceAmount: 0
        });
      }

      const summary = summaryMap.get(productName);
      
      if (record.type === 'stock_in') {
        summary.totalInQuantity += Number(record.quantity);
        summary.totalInAmount += Number(record.amount);
      } else {
        summary.totalOutQuantity += Number(record.quantity);
        summary.totalOutAmount += Number(record.amount);
      }
    });

    // 计算平均单价和结余
    summaryMap.forEach(summary => {
      if (summary.totalInQuantity > 0) {
        summary.avgUnitPrice = Number((summary.totalInAmount / summary.totalInQuantity).toFixed(4));
      }
      summary.balanceQuantity = summary.totalInQuantity - summary.totalOutQuantity;
      summary.balanceAmount = Number((summary.balanceQuantity * summary.avgUnitPrice).toFixed(2));
    });

    return Array.from(summaryMap.values());
  }

  // 获取带上期库存的记录（用于前端表格展示）
  async getRecordsWithPreviousStock(query: any = {}) {
    const { month, unit, product } = query;

    const where: any = {};
    if (month) where.month = month;
    
    if (unit) {
      where.OR = [
        { buyer: { name: { contains: unit } } },
        { seller: { name: { contains: unit } } }
      ];
    }
    
    if (product) {
      where.OR = where.OR || [];
      where.OR.push(
        { product: { name: { contains: product } } },
        { product: { model: { contains: product } } }
      );
    }

    // 获取所有记录并按日期排序
    const records = await this.prisma.stockRecord.findMany({
      where,
      include: {
        buyer: { select: { id: true, name: true, type: true } },
        seller: { select: { id: true, name: true, type: true } },
        product: { select: { id: true, name: true, model: true, spec: true, unit: true } }
      },
      orderBy: { date: 'asc' }
    });

    // 按月份分组
    const monthGroups = new Map<string, any[]>();
    records.forEach(record => {
      if (!monthGroups.has(record.month)) {
        monthGroups.set(record.month, []);
      }
      monthGroups.get(record.month)!.push(record);
    });

    // 按月份排序
    const sortedMonths = Array.from(monthGroups.keys()).sort((a, b) => {
      const monthA = parseInt(a.replace('月', ''));
      const monthB = parseInt(b.replace('月', ''));
      return monthA - monthB;
    });

    // 记录每个产品每个月末的库存
    const productMonthEndBalance = new Map<string, { quantity: number; amount: number; avgPrice: number }>();
    const result: any[] = [];

    sortedMonths.forEach((month, monthIndex) => {
      const monthRecords = monthGroups.get(month)!;

      // 获取上月末库存
      const previousMonthBalance = new Map<string, { quantity: number; amount: number }>();
      if (monthIndex > 0) {
        productMonthEndBalance.forEach((balance, productName) => {
          previousMonthBalance.set(productName, {
            quantity: balance.quantity,
            amount: balance.amount
          });
        });
      }

      // 添加上期库存记录（除了第一个月份）
      if (monthIndex > 0 && previousMonthBalance.size > 0) {
        previousMonthBalance.forEach((balance, productName) => {
          if (balance.quantity !== 0) {
            result.push({
              id: `previous-${month}-${productName}`,
              no: '',
              month,
              type: 'previous',
              buyer: { id: 0, name: '上期库存', type: 'system' },
              seller: null,
              product: { id: 0, name: productName, model: '', spec: '', unit: '' },
              model: '',
              unit: '',
              quantity: 0,
              amount: 0,
              unitPrice: productMonthEndBalance.get(productName)?.avgPrice || 0,
              taxRate: 0,
              taxAmount: 0,
              totalAmount: 0,
              previousQuantity: 0,
              previousAmount: 0,
              status: 'confirmed'
            });
          }
        });
      }

      // 处理当月记录，添加上期库存信息
      monthRecords.forEach(record => {
        const productName = record.product?.name || record.model || '未知产品';
        const prevBalance = previousMonthBalance.get(productName) || { quantity: 0, amount: 0 };

        result.push({
          ...record,
          previousQuantity: prevBalance.quantity,
          previousAmount: prevBalance.amount
        });
      });

      // 更新月末库存
      monthRecords.forEach(record => {
        const productName = record.product?.name || record.model || '未知产品';
        const currentBalance = productMonthEndBalance.get(productName) || { quantity: 0, amount: 0, avgPrice: 0 };

        let newQuantity: number, newAmount: number, newAvgPrice: number;

        if (record.type === 'stock_in') {
          newQuantity = currentBalance.quantity + Number(record.quantity);
          const totalInAmount = currentBalance.quantity * currentBalance.avgPrice + Number(record.amount);
          newAvgPrice = newQuantity > 0 ? totalInAmount / newQuantity : currentBalance.avgPrice;
          newAmount = newQuantity * newAvgPrice;
        } else {
          newQuantity = currentBalance.quantity - Number(record.quantity);
          newAmount = currentBalance.amount - Number(record.quantity) * currentBalance.avgPrice;
          newAvgPrice = currentBalance.avgPrice;
        }

        productMonthEndBalance.set(productName, {
          quantity: Number(newQuantity.toFixed(4)),
          amount: Number(newAmount.toFixed(2)),
          avgPrice: Number(newAvgPrice.toFixed(4))
        });
      });
    });

    return result;
  }
}
