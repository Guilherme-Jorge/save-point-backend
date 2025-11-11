export class RecommendationDto {
  igdbId!: number;
  name!: string;
  summary?: string;
  releaseDate?: Date;
  coverUrl?: string;
  genres!: { id: number; name: string }[];
  themes!: { id: number; name: string }[];
  platforms!: { id: number; name: string }[];
  rating?: number;
  ratingCount?: number;
  popularity?: number;
  popScore?: number;
}
