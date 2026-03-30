import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// In-memory OTP store (cho MVP — production nên dùng Redis)
const otpStore = new Map<string, { otp: string; expiresAt: Date; userId: string; contractId: string }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export class CreateContractDto {
  title: string;
  supplierId: string; // companyId of supplier
  value: number;
  currency?: string;
  terms?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class ContractService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateContractDto) {
    let user = await this.prisma.user.findUnique({ where: { id: userId }, include: { company: true } });
    
    // Tự động tạo Company Mock nếu Buyer chưa có hồ sơ doanh nghiệp (Cho MVP)
    if (!user?.companyId) {
      const mockCompany = await this.prisma.company.create({
        data: {
          name: user?.name ? `Hộ kinh doanh ${user.name}` : `Doanh nghiệp Khách hàng ${userId.substring(0, 5)}`,
          slug: `khach-hang-${userId.substring(0, 8)}`,
          email: user?.email,
          users: { connect: { id: userId } }
        }
      });
      await this.prisma.user.update({ where: { id: userId }, data: { companyId: mockCompany.id } });
      user = await this.prisma.user.findUnique({ where: { id: userId }, include: { company: true } });
    }

    // Sau khi tạo mock company, user phải có companyId
    if (!user?.companyId) {
      throw new Error('Không thể tạo hợp đồng: Người dùng chưa có thông tin công ty');
    }

    return this.prisma.contract.create({
      data: {
        title: dto.title,
        buyerId: user.companyId,
        supplierId: dto.supplierId,
        value: dto.value,
        currency: dto.currency || 'VND',
        terms: dto.terms,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: 'DRAFT',
      },
      include: {
        buyer: { select: { id: true, name: true, logo: true } },
        supplier: { select: { id: true, name: true, logo: true } },
      },
    });
  }

  async findMine(userId: string, page = 1, limit = 20) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.companyId) return { items: [], total: 0 };
    const skip = (page - 1) * limit;
    const where = { OR: [{ buyerId: user.companyId }, { supplierId: user.companyId }] };
    const [items, total] = await Promise.all([
      this.prisma.contract.findMany({
        where, skip, take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          buyer: { select: { id: true, name: true, logo: true } },
          supplier: { select: { id: true, name: true, logo: true } },
          signatures: true,
        },
      }),
      this.prisma.contract.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        buyer: true, supplier: true,
        signatures: { include: { user: { select: { id: true, name: true, email: true, companyId: true } } } },
        orders: true,
      },
    });
    if (!contract) throw new NotFoundException('Không tìm thấy hợp đồng');
    return contract;
  }

  async update(id: string, userId: string, data: Partial<CreateContractDto>) {
    const contract = await this.findOne(id);
    if (contract.status !== 'DRAFT') throw new ForbiddenException('Chỉ cập nhật hợp đồng ở trạng thái DRAFT');
    return this.prisma.contract.update({ where: { id }, data });
  }

  async submit(id: string) {
    return this.prisma.contract.update({ where: { id }, data: { status: 'PENDING' } });
  }

  // Sinh OTP và gửi (mock — hiện in ra console)
  async requestOtp(contractId: string, userId: string) {
    const contract = await this.findOne(contractId);
    if (contract.status !== 'APPROVED') {
      throw new BadRequestException('Hợp đồng chưa ở trạng thái sẵn sàng để ký.');
    }
    // Check chưa ký
    const alreadySigned = contract.signatures?.some((s: any) => s.userId === userId);
    if (alreadySigned) throw new BadRequestException('Đại biểu này đã ký hợp đồng rồi.');

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
    const key = `${contractId}_${userId}`;
    otpStore.set(key, { otp, expiresAt, userId, contractId });

    // Log OTP ra console (thay bằng email thật ở production)
    console.log(`\n✉️  OTP KY HOP DONG \n  Hợp đồng: ${contractId}\n  Người ký: ${user?.name} (${user?.email})\n  OTP: ${otp}\n  Hết hạn: ${expiresAt.toLocaleTimeString()}\n`);
    
    return {
      message: `Mã OTP đã gửi tới ${user?.email}. (Hệ thống demo: OTP = ${otp})`,
      email: user?.email,
      otp, // Trả về cho frontend trong dev mode
    };
  }

  async sign(id: string, userId: string, otp: string, signatureImage?: string) {
    const key = `${id}_${userId}`;
    const stored = otpStore.get(key);

    // Xác thực OTP
    if (!stored) throw new BadRequestException('Mã OTP chưa được khởi tạo. Vui lòng yêu cầu OTP trước.');
    if (new Date() > stored.expiresAt) {
      otpStore.delete(key);
      throw new BadRequestException('Mã OTP đã hết hạn. Vui lòng yêu cầu OTP mới.');
    }
    if (stored.otp !== otp) throw new BadRequestException('Mã OTP không chính xác.');

    // Xóa OTP sau khi dùng
    otpStore.delete(key);

    // Lưu chữ ký
    await this.prisma.contractSignature.create({
      data: { contractId: id, userId, signatureUrl: signatureImage },
    });
    
    // Kiểm tra nếu đủ 2 bên đã ký
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { signatures: true },
    });
    if (contract && contract.signatures.length >= 2) {
      await this.prisma.contract.update({ where: { id }, data: { status: 'SIGNED' } });
    }
    return this.findOne(id);
  }

  async complete(id: string) {
    return this.prisma.contract.update({ where: { id }, data: { status: 'COMPLETED' } });
  }

  async cancel(id: string) {
    return this.prisma.contract.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.contract.findMany({
        skip, take: limit, orderBy: { updatedAt: 'desc' },
        include: {
          buyer: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
        },
      }),
      this.prisma.contract.count(),
    ]);
    return { items, total, page, limit };
  }
}
