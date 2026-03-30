import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, phone: true, avatar: true,
        role: true, isActive: true, createdAt: true,
        company: true
      }
    });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    return user;
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string; avatar?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, phone: true, avatar: true, role: true }
    });
  }

  async changePassword(userId: string, data: { oldPassword?: string; newPassword: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    if (data.oldPassword) {
      const match = await bcrypt.compare(data.oldPassword, user.password);
      if (!match) throw new BadRequestException('Mật khẩu cũ không chính xác');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    return { success: true, message: 'Đổi mật khẩu thành công' };
  }

  async getPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, avatar: true, role: true, 
        company: { select: { id: true, name: true, logo: true, province: true, verificationStatus: true } }
      }
    });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    return user;
  }
}
