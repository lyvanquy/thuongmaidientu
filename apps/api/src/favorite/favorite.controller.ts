import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FavoriteService } from './favorite.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Favorites')
@Controller('favorites')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class FavoriteController {
  constructor(private service: FavoriteService) {}

  @Post('toggle')
  @ApiOperation({ summary: 'Toggle sản phẩm/công ty yêu thích' })
  toggle(@CurrentUser('id') userId: string, @Body() body: { productId?: string; companyId?: string }) {
    return this.service.toggle(userId, body.productId, body.companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách yêu thích của tôi' })
  findMine(@CurrentUser('id') userId: string) {
    return this.service.findMine(userId);
  }
}
