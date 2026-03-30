import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class NotificationController {
  constructor(private service: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách thông báo của tôi' })
  findMine(@CurrentUser('id') userId: string, @Query() q: any) {
    return this.service.findMine(userId, q.page, q.limit);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu đã đọc' })
  markRead(@Param('id') id: string) { return this.service.markRead(id); }

  @Patch('read-all')
  @ApiOperation({ summary: 'Đánh dấu tất cả đã đọc' })
  markAllRead(@CurrentUser('id') userId: string) { return this.service.markAllRead(userId); }
}
