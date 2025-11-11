import { IsInt, IsOptional, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class RecommendationQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 20;
}
