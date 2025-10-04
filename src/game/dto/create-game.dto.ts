import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateGameDto {
  @IsInt()
  @IsNotEmpty()
  igdbId: number;

  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsDate()
  @IsOptional()
  releaseDate?: Date;
}
