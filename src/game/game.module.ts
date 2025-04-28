import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { Company } from './entities/company.entity';
import { GameGamemode } from './entities/game-gamemode.entity';
import { GameGenre } from './entities/game-genre.entity';
import { GamePlatform } from './entities/game-platform.entity';
import { GameTheme } from './entities/game-theme.entity';
import { Gamemode } from './entities/gamemode.entity';
import { Genre } from './entities/genre.entity';
import { InvolvedCompany } from './entities/involved-company.entity';
import { Platform } from './entities/platform.entity';
import { Screenshot } from './entities/screenshot.entity';
import { Theme } from './entities/theme.entity';
import { ConfigModule } from '@nestjs/config';
import igdbConfig from 'src/config/igdb.config';
import { HttpModule } from '@nestjs/axios';
import { Artwork } from './entities/artwork.entity';

@Module({
  imports: [
    ConfigModule.forFeature(igdbConfig),
    TypeOrmModule.forFeature([
      Company,
      GameGamemode,
      GameGenre,
      GamePlatform,
      GameTheme,
      Game,
      Gamemode,
      Genre,
      InvolvedCompany,
      Platform,
      Artwork,
      Screenshot,
      Theme,
    ]),
    HttpModule,
  ],
  exports: [GameService],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
