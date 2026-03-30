import { Controller, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin cá nhân hiện tại' })
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() body: { name?: string; phone?: string; avatar?: string }
  ) {
    return this.usersService.updateProfile(userId, body);
  }

  @Patch('me/password')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đổi mật khẩu' })
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() body: { oldPassword?: string; newPassword: string }
  ) {
    return this.usersService.changePassword(userId, body);
  }

  @Get(':id/public')
  @ApiOperation({ summary: 'Lấy thông tin công khai của User (Dùng cho Chat/Review)' })
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
