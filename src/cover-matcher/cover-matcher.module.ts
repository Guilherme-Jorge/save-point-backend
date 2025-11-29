import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Game } from "src/game/entities/game.entity";
import { GameModule } from "src/game/game.module";
import { CoverMatcherService } from "./cover-matcher.service";
import { CoverMatcherController } from "./cover-matcher.controller";
import { IgdbModule } from "src/shared/http/igdb.module";

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    TypeOrmModule.forFeature([Game]),
    GameModule,
    IgdbModule,
  ],
  providers: [CoverMatcherService],
  controllers: [CoverMatcherController],
  exports: [CoverMatcherService],
})
export class CoverMatcherModule {}
