import { IsDate, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { Game } from 'src/game/entities/game.entity';
import { GameProgress } from 'src/game/enums/game-progress.enum';
import { GameStatus } from 'src/game/enums/game-status.enum';
import { User } from 'src/user/entities/user.entity';

export class CreateOwnershipDto {
  @IsNotEmpty()
  user: User;

  @IsNotEmpty()
  game: Game;

  @IsEnum(GameStatus)
  @IsOptional()
  status?: GameStatus;

  @IsEnum(GameProgress)
  @IsOptional()
  progress?: GameProgress;

  @IsDate()
  @IsOptional()
  startedAt?: Date;

  @IsDate()
  @IsOptional()
  endedAt?: Date;
}
