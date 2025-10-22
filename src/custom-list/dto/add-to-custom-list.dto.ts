import { IsString } from "class-validator";

export class AddToCustomListDto {
  @IsString()
  userId: string;

  @IsString()
  listId: string;

  @IsString()
  gameId: string;
}
