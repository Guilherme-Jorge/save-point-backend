import { GameReturn } from "src/game/dto/game-return.dto";

export interface PopScorePopularityMetricDto {
  readonly id: number;
  readonly name: string;
  readonly popularitySource: number;
  readonly updatedAt: string;
}

export interface PopScoreRecommendationItemDto {
  readonly score: number;
  readonly game: GameReturn;
}

export interface PopScoreRecommendationResponseDto {
  readonly metric: PopScorePopularityMetricDto;
  readonly items: PopScoreRecommendationItemDto[];
}
