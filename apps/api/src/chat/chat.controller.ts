import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Chat')
@Controller('chats')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo cuộc trò chuyện mới' })
  create(@Body() body: { participantIds: string[]; rfqId?: string; contractId?: string }) {
    return this.chatService.createChat(body.participantIds, body.rfqId, body.contractId);
  }

  @Get('my')
  @ApiOperation({ summary: 'Danh sách chat của tôi' })
  findMy(@CurrentUser('id') userId: string) {
    return this.chatService.findMyChats(userId);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Lịch sử tin nhắn' })
  getMessages(@Param('id') chatId: string, @Query() q: any) {
    return this.chatService.getMessages(chatId, q.page, q.limit);
  }
}
