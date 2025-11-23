import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import { RecommendationService } from "./recommendation.service";

@Controller("recommendations")
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get("default")
  getDefaultRecommendations(
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.recommendationService.getDefaultRecommendations({ limit });
  }

  @Get("trending")
  getTrendingGames(
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.recommendationService.getTrendingGames(limit);
  }

  @Get("top-rated")
  getTopRatedGames(
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.recommendationService.getTopRatedGames(limit);
  }

  @Get("personalized")
  getPersonalizedRecommendations(
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query("genres") genres?: string,
  ) {
    return this.recommendationService.getPersonalizedRecommendations({
      limit,
      genreIds: this.parseGenreIds(genres),
    });
  }

  @Get("personalized/upcoming")
  getPersonalizedUpcomingRecommendations(
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query("genres") genres?: string,
  ) {
    return this.recommendationService.getPersonalizedUpcomingRecommendations({
      limit,
      genreIds: this.parseGenreIds(genres),
    });
  }

  private parseGenreIds(genres?: string): number[] | undefined {
    if (!genres) {
      return undefined;
    }

    const values = genres
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value));

    return values.length > 0 ? Array.from(new Set(values)) : undefined;
  }
}
