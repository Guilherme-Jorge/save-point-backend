import { IsString } from "class-validator";

export class CreateCustomListDto {
  @IsString()
  userId: string;

  @IsString()
  name: string;
}
