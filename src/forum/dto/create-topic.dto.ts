import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateTopicDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  message: string;
}
