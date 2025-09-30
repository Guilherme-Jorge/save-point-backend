import { IsNotEmpty } from "class-validator";

export class ChatMessagesDto {
  @IsNotEmpty()
  userId: string;
}
