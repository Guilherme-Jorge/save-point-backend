import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { UniqueEmail } from '../validator/email.validator';

export class UserRegister {
  @IsEmail(undefined, { message: 'The email is invalid.' })
  @UniqueEmail({ message: 'This email has already been registered.' })
  email: string;

  @MinLength(5)
  password: string;

  @IsNotEmpty()
  username: string;
}
