import { IsNotEmpty, IsString } from "class-validator";

export class UserDeactivate {
  @IsString()
  @IsNotEmpty()
  password: string;
}
