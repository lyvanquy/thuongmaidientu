import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { ContractStatus, NotificationType } from '@prisma/client';

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
  rfqId?: string; // MỚI: Dùng để tự động nạp dữ liệu từ Báo Giá
}

@Injectable()
export class ContractService {
  constructor(
    private prisma: PrismaService,
    private notification: NotificationService
  ) {}

  async create(userId: string, dto: CreateContractDto) {
    return this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { id: userId }, include: { company: true } });
      
      // Tự động tạo Company Mock nếu Buyer chưa có hồ sơ doanh nghiệp (Cho MVP)
      if (!user?.companyId) {
        const mockCompany = await tx.company.create({
          data: {
            name: user?.name ? `Hộ kinh doanh ${user.name}` : `Doanh nghiệp Khách hàng ${userId.substring(0, 5)}`,
            slug: `khach-hang-${userId.substring(0, 8)}`,
            email: user?.email,
            users: { connect: { id: userId } }
          }
        });
        await tx.user.update({ where: { id: userId }, data: { companyId: mockCompany.id } });
        user = await tx.user.findUnique({ where: { id: userId }, include: { company: true } });
      }

      if (!user?.companyId) {
        throw new BadRequestException('Không thể tạo hợp đồng: Người dùng chưa có thông tin công ty');
      }

      // Tự động kết nối Quotation nếu từ RFQ
      let autoFilledValue = dto.value;
      let autoFilledTerms = dto.terms || '';

      if (dto.rfqId) {
        const quotation = await tx.quotation.findFirst({
          where: { rfqId: dto.rfqId, companyId: dto.supplierId, status: 'ACCEPTED' },
          orderBy: { createdAt: 'desc' }
        });
        if (quotation) {
          autoFilledValue = quotation.price;
          autoFilledTerms = `Báo giá tham chiếu: ${quotation.id}.\n${quotation.message || ''}\n${dto.terms || ''}`.trim();
        }
      }

      const contract = await tx.contract.create({
        data: {
          title: dto.title,
          buyerId: user.companyId,
          supplierId: dto.supplierId,
          value: autoFilledValue,
          currency: dto.currency || 'VND',
          terms: autoFilledTerms,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          status: ContractStatus.DRAFT,
        },
        include: {
          buyer: { select: { id: true, name: true, logo: true } },
          supplier: { select: { id: true, name: true, logo: true } },
        },
      });

      // Thông báo cho nhà cung cấp
      const supplierUser = await tx.user.findFirst({ where: { companyId: dto.supplierId } });
      if (supplierUser) {
        await this.notification.create(
          supplierUser.id,
          'Một hợp đồng nháp vừa được cấu thành',
          `Đối tác ${contract.buyer.name} vừa soạn một hợp đồng nháp: "${contract.title}"`,
          NotificationType.CONTRACT,
          `/contracts/${contract.id}`
        );
      }

      return contract;
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
    if (contract.status !== ContractStatus.DRAFT) {
      throw new ForbiddenException('Chỉ cập nhật hợp đồng ở trạng thái DRAFT');
    }
    return this.prisma.contract.update({ where: { id }, data });
  }

  async submit(id: string) {
    const contract = await this.prisma.contract.update({ 
      where: { id }, 
      data: { status: ContractStatus.PENDING },
      include: { buyer: true, supplier: true }
    });

    // Notify users from the other party
    const supplierUser = await this.prisma.user.findFirst({ where: { companyId: contract.supplierId } });
    if (supplierUser) {
      await this.notification.create(
        supplierUser.id,
        'Hợp đồng chờ duyệt',
        `Hợp đồng "${contract.title}" vừa được đệ trình. Vui lòng kiểm tra và duyệt.`,
        NotificationType.CONTRACT,
        `/contracts/${contract.id}`
      );
    }

    return contract;
  }

  async requestOtp(contractId: string, userId: string) {
    const contract = await this.findOne(contractId);
    if (contract.status !== ContractStatus.APPROVED && contract.status !== ContractStatus.SIGNED) {
      throw new BadRequestException('Hợp đồng chưa ở trạng thái sẵn sàng để ký.');
    }
    const alreadySigned = contract.signatures?.some((s: any) => s.userId === userId);
    if (alreadySigned) {
      throw new BadRequestException('Đại biểu này đã ký hợp đồng rồi.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    // Vô hiệu hóa các OTP cũ của lượt ký này
    await this.prisma.otp.updateMany({
      where: { contractId, userId, isUsed: false },
      data: { isUsed: true }
    });

    // Lưu DB
    await this.prisma.otp.create({
      data: {
        code: otpCode,
        userId: userId,
        contractId: contractId,
        expiresAt: expiresAt
      }
    });

    console.log(`\n✉️  [DATABASE OTP] KÝ HỢP ĐỒNG \n  Hợp đồng: ${contractId}\n  Người ký: ${user?.name} (${user?.email})\n  OTP: ${otpCode}\n  Hết hạn: ${expiresAt.toLocaleTimeString()}\n`);
    
    return {
      message: `Mã OTP đã gửi tới ${user?.email}. (Hệ thống demo: OTP = ${otpCode})`,
      email: user?.email,
      otp: otpCode, // Chỉ dành cho Dev Mode
    };
  }

  async sign(id: string, userId: string, otp: string, signatureImage?: string, stampUrl?: string, signerTitle?: string) {
    return this.prisma.$transaction(async (tx) => {
      // Tìm mã OTP còn hạn
      const storedOtp = await tx.otp.findFirst({
        where: {
          contractId: id,
          userId: userId,
          isUsed: false,
          code: otp,
          expiresAt: { gt: new Date() }
        }
      });

      if (!storedOtp) {
        throw new BadRequestException('Mã OTP không chính xác, đã hết hạn hoặc chưa được khởi tạo.');
      }

      if (!signerTitle) {
        throw new BadRequestException('Vui lòng cung cấp chức danh đại diện pháp luật khi ký.');
      }

      // Đánh dấu OTP đã dùng
      await tx.otp.update({
        where: { id: storedOtp.id },
        data: { isUsed: true }
      });

      // Lưu chữ ký
      await tx.contractSignature.create({
        data: { contractId: id, userId, signatureUrl: signatureImage, stampUrl, signerTitle },
      });
      
      const contract = await tx.contract.findUnique({
        where: { id },
        include: { signatures: true, buyer: true, supplier: true },
      });

      // Cập nhật trạng thái
      if (contract && contract.signatures.length >= 2) {
        await tx.contract.update({ where: { id }, data: { status: ContractStatus.SIGNED } });
        
        // Thông báo
        const buyerUser = await tx.user.findFirst({ where: { companyId: contract.buyerId } });
        const supplierUser = await tx.user.findFirst({ where: { companyId: contract.supplierId } });
        
        if (buyerUser) await this.notification.create(buyerUser.id, 'Hợp đồng đã hoàn tất ký kết', `Hợp đồng "${contract.title}" đã được hai bên ký thành công.`, NotificationType.CONTRACT, `/contracts/${contract.id}`);
        if (supplierUser) await this.notification.create(supplierUser.id, 'Hợp đồng đã hoàn tất ký kết', `Hợp đồng "${contract.title}" đã được hai bên ký thành công.`, NotificationType.CONTRACT, `/contracts/${contract.id}`);
      }

      return tx.contract.findUnique({
        where: { id },
        include: {
          buyer: true, supplier: true,
          signatures: { include: { user: { select: { id: true, name: true, email: true, companyId: true } } } },
        },
      });
    });
  }

  async complete(id: string) {
    return this.prisma.contract.update({ where: { id }, data: { status: ContractStatus.COMPLETED } });
  }

  async cancel(id: string) {
    return this.prisma.contract.update({ where: { id }, data: { status: ContractStatus.CANCELLED } });
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
