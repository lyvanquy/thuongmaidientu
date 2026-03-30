import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createChat(participantIds: string[], rfqId?: string, contractId?: string) {
    const chat = await this.prisma.chat.create({
      data: {
        rfqId,
        contractId,
        participants: {
          create: participantIds.map((userId) => ({ userId })),
        },
      },
      include: { participants: { include: { user: { select: { id: true, name: true, avatar: true, companyId: true } } } } },
    });
    return chat;
  }

  async findMyChats(userId: string) {
    return this.prisma.chat.findMany({
      where: { participants: { some: { userId } } },
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: { include: { user: { select: { id: true, name: true, avatar: true, companyId: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  async getMessages(chatId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { chatId },
        skip, take: limit,
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, name: true, avatar: true } } },
      }),
      this.prisma.message.count({ where: { chatId } }),
    ]);
    return { items, total, page, limit };
  }

  async createMessage(chatId: string, senderId: string, content: string, type = 'TEXT') {
    const message = await this.prisma.message.create({
      data: { chatId, senderId, content, type: type as any },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    });
    await this.prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });
    return message;
  }
}
