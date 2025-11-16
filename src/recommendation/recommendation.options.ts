import { PopScorePopularityType } from "./enums/popscore-popularity-type.enum";

export interface PopScoreRecommendationOptions {
  readonly defaultMetric: PopScorePopularityType;
}

export const POPSCORE_RECOMMENDATION_OPTIONS =
  "POPSCORE_RECOMMENDATION_OPTIONS";

export const defaultPopScoreRecommendationOptions: PopScoreRecommendationOptions =
  {
    defaultMetric: PopScorePopularityType.Visits,
  };
