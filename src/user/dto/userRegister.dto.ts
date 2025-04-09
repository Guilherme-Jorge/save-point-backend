import { IsEmail, IsNotEmpty, MinLength } from "class-validator";
import { UniqueEmail } from "../validator/email.validator";

export class UserRegister {

    @IsEmail(undefined, { message: 'O email é inválido.' })
    @UniqueEmail({ message: 'Este email já foi cadastrado.' })
    email: string;

    @MinLength(5)
    password: string;

    @IsNotEmpty()
    username: string;
}