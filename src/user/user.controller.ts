import { Body, Controller, Post } from '@nestjs/common';
import { UserRegister } from './dto/userRegister.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post('register')
    async registerUser(@Body() user: UserRegister) {
        const respose = await this.userService.registerUser(user);
        return respose;
    }
    
}
