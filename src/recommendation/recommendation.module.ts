import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { RecommendationController } from "./recommendation.controller";
import { RecommendationService } from "./recommendation.service";
import igdbConfig from "src/config/igdb.config";
import { IgdbAuthService } from "src/shared/services/igdb-auth.service";
import { GameFromIgdbPipe } from "src/shared/pipes/game-from-igdb.pipe";
import {
  POPSCORE_RECOMMENDATION_OPTIONS,
  defaultPopScoreRecommendationOptions,
} from "./recommendation.options";
import { IgdbDiscoverService } from "./services/igdb-discover.service";
import { GameModule } from "src/game/game.module";

@Module({
  imports: [ConfigModule.forFeature(igdbConfig), HttpModule, GameModule],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    IgdbAuthService,
    GameFromIgdbPipe,
    IgdbDiscoverService,
    {
      provide: POPSCORE_RECOMMENDATION_OPTIONS,
      useValue: defaultPopScoreRecommendationOptions,
    },
  ],
  exports: [RecommendationService],
})
export class RecommendationModule {}
