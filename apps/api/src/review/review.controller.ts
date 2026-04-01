import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReviewService, CreateReviewDto } from './review.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@CurrentUser('id') userId: string, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.create(userId, createReviewDto);
  }

  @Get('product/:id')
  findByProduct(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    return this.reviewService.findByProduct(id, +page, +limit);
  }

  @Get('company/:id')
  findByCompany(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    return this.reviewService.findByCompany(id, +page, +limit);
  }
}
