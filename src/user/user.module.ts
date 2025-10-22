import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { EmailValidator } from "./validator/email.validator";
import { ConfigModule } from "@nestjs/config";
import userConfig from "src/config/user.config";
import { EmailModule } from "src/email/email.module";
import { CustomList } from "src/custom-list/entities/custom-list.entity";

@Module({
  imports: [
    EmailModule,
    ConfigModule.forFeature(userConfig),
    TypeOrmModule.forFeature([User, CustomList]),
  ],
  providers: [UserService, EmailValidator],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
