import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Game } from "src/game/entities/game.entity";
import { GameModule } from "src/game/game.module";
import { CoverMatcherService } from "./cover-matcher.service";
import { CoverMatcherController } from "./cover-matcher.controller";
import { IgdbGameSearchService } from "src/game/services/igdb-game-search.service";
import { IgdbAuthService } from "src/shared/services/igdb-auth.service";

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    TypeOrmModule.forFeature([Game]),
    GameModule,
  ],
  providers: [CoverMatcherService, IgdbGameSearchService, IgdbAuthService],
  controllers: [CoverMatcherController],
  exports: [CoverMatcherService],
})
export class CoverMatcherModule {}
