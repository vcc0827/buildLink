import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const { page = 1, pageSize = 10, username, nickname, role, status } = query;
    const where: any = {};
    if (username) where.username = { contains: username };
    if (nickname) where.nickname = { contains: nickname };
    if (role) where.role = role;
    if (status) where.status = status;

    const [list, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, username: true, nickname: true, role: true, email: true, phone: true, status: true, createdAt: true },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }
}
