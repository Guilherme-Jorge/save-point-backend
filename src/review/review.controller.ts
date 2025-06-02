import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { UserByIdPipe } from 'src/user/pipes/user-by-id.pipe';
import { User } from 'src/user/entities/user.entity';
import { GameByIdPipe } from 'src/game/pipes/game-by-id.pipe';
import { Game } from 'src/game/entities/game.entity';
import { ReviewByIdPipe } from './pipes/review-by-id.pipe';
import { Review } from './entities/review.entity';
import { ReviewByUserIdPipe } from './pipes/review-by-user-id.pipe';
import { ReviewByGameIdPipe } from './pipes/review-by-game-id.pipe';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  create(
    @Body() createReviewDto: Omit<CreateReviewDto, 'user' | 'game'>,
    @Body('user', UserByIdPipe) user: User,
    @Body('game', GameByIdPipe) game: Game,
  ) {
    const dto = { ...createReviewDto, user, game };

    return this.reviewService.create(dto);
  }

  @Get()
  findAll() {
    return this.reviewService.findAll();
  }

  @Get('user/:id')
  findAllByUser(@Param('id', ReviewByUserIdPipe) reviews: Review[]) {
    return reviews;
  }

  @Get('game/:id')
  findAllByGame(@Param('id', ReviewByGameIdPipe) reviews: Review[]) {
    return reviews;
  }

  @Get('review/:id')
  findOne(@Param('id', ReviewByIdPipe) review: Review) {
    return review;
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewService.update(id, updateReviewDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewService.remove(id);
  }
}
