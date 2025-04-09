import { IsEmail, IsNotEmpty } from "class-validator";

export class UserSignIn {

    @IsEmail(undefined, { message: 'O email é inválido.' })
    email: string;

    @IsNotEmpty()
    password: string;
}