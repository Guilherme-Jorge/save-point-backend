import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Headers,
  Req,
  UseGuards,
  Res,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { UserSignIn } from "./dto/userSignIn.dto";
import { UserRegister } from "./dto/userRegister.dto";
import { UserUpdate } from "./dto/userUpdate.dto";
import { UserDeactivate } from "./dto/userDeactivate.dto";
import { HashPasswordPipe } from "src/shared/pipes/hash-password.pipe";
import { UserByIdPipe } from "./pipes/user-by-id.pipe";
import { User } from "./entities/user.entity";
import { AuthGuard } from "@nestjs/passport";
import { Response } from "express";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("google")
  @UseGuards(AuthGuard("google"))
  async googleAuth(@Req() req) {
    // Do nothing. Redirect to google Auth.
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    return this.userService.loginWithGoogle(req.user, res);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(":id")
  findById(@Param("id", UserByIdPipe) user: User[]) {
    return user;
  }

  @Post("register")
  async registerUser(
    @Body() user: UserRegister,
    @Body("password", HashPasswordPipe) hashPassword: string,
    @Headers("accept-language") acceptLanguage: string,
  ) {
    return await this.userService.registerUser(
      {
        ...user,
        password: hashPassword,
      },
      acceptLanguage,
    );
  }

  @Post("signin")
  async signIn(@Body() user: UserSignIn) {
    return await this.userService.signIn(user);
  }

  @Post("forgotpass")
  async forgotPassFirstStep(@Body("email") email: string) {
    const response = await this.userService.forgotPass(email);
    return response;
  }

  @Post("recoverpass/:id")
  async forgotPassSecondStep(
    @Param("id") token: string,
    @Body("newPassword") newPass: string,
  ) {
    const response = await this.userService.recoverPass(token, newPass);
    return response;
  }

  @Put(":id")
  async updateUser(@Param("id") id: string, @Body() user: UserUpdate) {
    const response = await this.userService.updateUser(id, user);
    return response;
  }

  @Delete(":id")
  async deleteUser(
    @Param("id") id: string,
    @Body() userDeactivate: UserDeactivate,
  ) {
    const response = await this.userService.deleteUser(id, userDeactivate.password);
    return response;
  }
}
