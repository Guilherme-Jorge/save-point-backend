import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { UserSignIn } from './dto/userSignIn.dto';
import { UserRegister } from './dto/userRegister.dto';
import { UserUpdate } from './dto/userUpdate.dto';
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

  @Put(':id')
  async updateUser(@Param('id') id: string,@Body() user: UserUpdate) {
      const response = await this.userService.updateUser(id, user);
      return response;
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Body('password') password: string) { 
      const response = await this.userService.deleteUser(id, password);
      return response;
  }
}
