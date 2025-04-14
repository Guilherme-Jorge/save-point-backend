import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { Achievement } from 'src/achievement/entities/achievement.entity';
import { Company } from './entities/company.entity';
import { GameGamemode } from './entities/game-gamemode.entity';
import { GameGenre } from './entities/game-genre.entity';
import { GamePlatform } from './entities/game-platform.entity';
import { GameTheme } from './entities/game-theme.entity';
import { Gamemode } from './entities/gamemode.entity';
import { Genre } from './entities/genre.entity';
import { InvolvedCompany } from './entities/involved-company.entity';
import { Ownership } from './entities/ownership.entity';
import { Platform } from './entities/platform.entity';
import { Screenshot } from './entities/screenshot.entity';
import { Theme } from './entities/theme.entity';
import { Wishlist } from './entities/wishlist.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Achievement,
      Company,
      GameGamemode,
      GameGenre,
      GamePlatform,
      GameTheme,
      Game,
      Gamemode,
      Genre,
      InvolvedCompany,
      Ownership,
      Platform,
      Screenshot,
      Theme,
      Wishlist,
    ]),
  ],
  exports: [TypeOrmModule],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
