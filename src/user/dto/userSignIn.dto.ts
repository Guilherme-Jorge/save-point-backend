import { IsEmail, IsNotEmpty } from 'class-validator';

export class UserSignIn {
  @IsEmail(undefined, { message: 'This email is invalid.' })
  email: string;

  @IsNotEmpty()
  password: string;
}
