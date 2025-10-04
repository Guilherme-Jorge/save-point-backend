import { IsString } from "class-validator";

export class SocialDto {
  @IsString()
  userId: string;

  @IsString()
  followerId: string;
}
