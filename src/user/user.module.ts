import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EmailValidator } from './validator/email.validator';
import { ConfigModule } from '@nestjs/config';
import userConfig from 'src/config/user.config';

@Module({
  imports: [
    ConfigModule.forFeature(userConfig),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [UserService, EmailValidator],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
