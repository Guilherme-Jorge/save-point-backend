import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateTopicMessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  message: string;

  @IsString()
  @IsNotEmpty()
  topicId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
