import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { user } from './entity/user.entity';
import { EmailValidator } from './validator/email.validator';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
  TypeOrmModule.forFeature([user])],
  providers: [UserService, EmailValidator],
  controllers: [UserController]
})
export class UserModule {}
