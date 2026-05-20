import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('userinfo')
  async getUserInfo(@Request() req) {
    return this.authService.getUserInfo(req.user.sub);
  }

  @Post('init')
  async initData() {
    return this.authService.initData();
  }
}
