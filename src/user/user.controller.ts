import { Body, Controller, Param, Post } from '@nestjs/common';
import { UserRegister } from './dto/userRegister.dto';
import { UserService } from './user.service';
import { UserSignIn } from './dto/userSignIn.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async registerUser(@Body() user: UserRegister) {
    return await this.userService.registerUser(user);
  }

  @Post('signin')
  async signIn(@Body() user: UserSignIn) {
    return await this.userService.signIn(user);
  }
}
