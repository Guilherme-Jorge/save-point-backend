import { IsNotEmpty } from "class-validator";

export class CreateChatDto {
  @IsNotEmpty()
  userRequestedId: string;

  @IsNotEmpty()
  userDestinationId: string;
}
