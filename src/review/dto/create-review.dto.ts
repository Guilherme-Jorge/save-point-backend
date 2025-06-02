import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Game } from 'src/game/entities/game.entity';
import { User } from 'src/user/entities/user.entity';

export class CreateReviewDto {
  @IsNotEmpty()
  user: User;

  @IsNotEmpty()
  game: Game;

  @IsBoolean()
  rating: boolean;

  @IsString()
  @IsOptional()
  reviewText?: string;
}
