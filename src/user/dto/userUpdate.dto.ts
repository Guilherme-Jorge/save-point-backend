import { IsOptional } from "class-validator";

export class UserUpdate {

    @IsOptional()
    username: string;

    @IsOptional()
    email: string;

}