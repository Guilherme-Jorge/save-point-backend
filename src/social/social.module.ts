import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Follows } from './entities/follows.entity';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Follows])],
  exports: [SocialService],
  controllers: [SocialController],
  providers: [SocialService],
})
export class SocialModule {}
