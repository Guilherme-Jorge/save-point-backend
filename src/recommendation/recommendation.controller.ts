import { Controller, Get, Query } from "@nestjs/common";
import { RecommendationService } from "./recommendation.service";
import { RecommendationQueryDto } from "./dto/recommendation-query.dto";
import { GenreRecommendationQueryDto } from "./dto/genre-recommendation-query.dto";

@Controller("recommendations")
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get("default")
  getDefaultRecommendations(@Query() queryDto: RecommendationQueryDto) {
    return this.recommendationService.getDefaultRecommendations(queryDto.limit);
  }

  @Get("trending")
  getTrendingRecommendations(@Query() queryDto: RecommendationQueryDto) {
    return this.recommendationService.getTrendingGames(queryDto.limit);
  }

  @Get("top-rated")
  getTopRatedRecommendations(@Query() queryDto: RecommendationQueryDto) {
    return this.recommendationService.getTopRatedGames(queryDto.limit);
  }

  @Get("by-genre")
  getRecommendationsByGenre(@Query() queryDto: GenreRecommendationQueryDto) {
    return this.recommendationService.getRecommendationsByGenre(
      queryDto.genreIds,
      queryDto.limit,
    );
  }
}
