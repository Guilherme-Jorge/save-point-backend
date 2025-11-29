import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RecommendationController } from "./recommendation.controller";
import { RecommendationService } from "./recommendation.service";
import igdbConfig from "src/config/igdb.config";
import {
  POPSCORE_RECOMMENDATION_OPTIONS,
  defaultPopScoreRecommendationOptions,
} from "./recommendation.options";
import { IgdbDiscoverService } from "./services/igdb-discover.service";
import { GameModule } from "src/game/game.module";
import { IgdbModule } from "src/shared/http/igdb.module";

@Module({
  imports: [ConfigModule.forFeature(igdbConfig), GameModule, IgdbModule],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    IgdbDiscoverService,
    {
      provide: POPSCORE_RECOMMENDATION_OPTIONS,
      useValue: defaultPopScoreRecommendationOptions,
    },
  ],
  exports: [RecommendationService],
})
export class RecommendationModule {}
