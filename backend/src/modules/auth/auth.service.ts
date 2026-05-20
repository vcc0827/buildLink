import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.initData();
  }

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('账号已被禁用');
    }

    const secret = this.configService.get<string>('JWT_SECRET') || 'buildlink-secret';
    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    }, { secret });

    return {
      code: 200,
      data: {
        token,
        userInfo: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          role: user.role,
          email: user.email,
          phone: user.phone,
        },
      },
      message: '登录成功',
    };
  }

  async getUserInfo(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, nickname: true, role: true, email: true, phone: true },
    });
    return user;
  }

  async initData() {
    const password = await bcrypt.hash('123456', 10);
    const existingUser = await this.prisma.user.findUnique({ where: { username: 'admin' } });
    if (!existingUser) {
      await this.prisma.user.create({
        data: {
          username: 'admin',
          password,
          nickname: '管理员',
          role: 'admin',
          email: 'admin@buildlink.com',
          phone: '13800138000',
          status: 'active',
        },
      });
      await this.prisma.user.create({
        data: {
          username: 'finance',
          password,
          nickname: '财务人员',
          role: 'finance',
          email: 'finance@buildlink.com',
          phone: '13800138001',
          status: 'active',
        },
      });
      await this.prisma.user.create({
        data: {
          username: 'sales',
          password,
          nickname: '业务员',
          role: 'sales',
          email: 'sales@buildlink.com',
          phone: '13800138002',
          status: 'active',
        },
      });
    }
    return { message: '初始化成功' };
  }
}
