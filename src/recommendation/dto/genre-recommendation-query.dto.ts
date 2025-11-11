import {
  IsArray,
  ArrayNotEmpty,
  IsInt,
  IsOptional,
  Max,
  Min,
} from "class-validator";
import { Transform, Type } from "class-transformer";

function castToNumberArray(value: unknown): number[] {
  const inputs: unknown[] = Array.isArray(value)
    ? (value as unknown[])
    : [value];

  return inputs
    .flatMap((element): unknown[] =>
      typeof element === "string" ? element.split(",") : [element],
    )
    .map((element) => Number(element))
    .filter((element): element is number => Number.isFinite(element));
}

export class GenreRecommendationQueryDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Transform(({ value }) => castToNumberArray(value))
  genreIds!: number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 20;
}
