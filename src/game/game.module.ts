import { Module } from "@nestjs/common";
import { GameController } from "./game.controller";
import { GameService } from "./game.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Game } from "./entities/game.entity";
import { Company } from "./entities/company.entity";
import { GameGamemode } from "./entities/game-gamemode.entity";
import { GameGenre } from "./entities/game-genre.entity";
import { GamePlatform } from "./entities/game-platform.entity";
import { GameTheme } from "./entities/game-theme.entity";
import { Gamemode } from "./entities/gamemode.entity";
import { Genre } from "./entities/genre.entity";
import { InvolvedCompany } from "./entities/involved-company.entity";
import { Platform } from "./entities/platform.entity";
import { Screenshot } from "./entities/screenshot.entity";
import { Cover } from "./entities/cover.entity";
import { Theme } from "./entities/theme.entity";
import { ConfigModule } from "@nestjs/config";
import igdbConfig from "src/config/igdb.config";
import { HttpModule } from "@nestjs/axios";
import { Artwork } from "./entities/artwork.entity";
import { IgdbGameImportService } from "./services/igdb-game-import.service";
import { IgdbGameSearchService } from "./services/igdb-game-search.service";
import { IgdbAuthService } from "src/shared/services/igdb-auth.service";
import { GameFromIgdbPipe } from "src/shared/pipes/game-from-igdb.pipe";

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
      Cover,
      Theme,
    ]),
    HttpModule,
  ],
  exports: [GameService],
  controllers: [GameController],
  providers: [
    GameService,
    IgdbGameImportService,
    IgdbGameSearchService,
    IgdbAuthService,
    GameFromIgdbPipe,
  ],
})
export class GameModule {}
