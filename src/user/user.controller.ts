import { Body, Controller, Param, Post } from '@nestjs/common';
import { UserRegister } from './dto/userRegister.dto';
import { UserService } from './user.service';
import { UserSignIn } from './dto/userSignIn.dto';
import { HashPasswordPipe } from 'src/shared/pipes/hash-password.pipe';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async registerUser(@Body() user: UserRegister, @Body('password', HashPasswordPipe) hashPassword: string) {
    return await this.userService.registerUser({...user, password: hashPassword});
  }

  @Post('signin')
  async signIn(@Body() user: UserSignIn) {
    return await this.userService.signIn(user);
  }
}
