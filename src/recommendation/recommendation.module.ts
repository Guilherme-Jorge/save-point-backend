import { Module } from "@nestjs/common";
import { RecommendationService } from "./recommendation.service";
import { RecommendationController } from "./recommendation.controller";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import igdbConfig from "src/config/igdb.config";
import { IgdbAuthService } from "src/shared/services/igdb-auth.service";

@Module({
  imports: [ConfigModule.forFeature(igdbConfig), HttpModule],
  providers: [RecommendationService, IgdbAuthService],
  controllers: [RecommendationController],
  exports: [RecommendationService],
})
export class RecommendationModule {}
