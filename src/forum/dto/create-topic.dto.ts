import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateTopicDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  message: string;

  @IsString()
  @IsNotEmpty()
  gameId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
