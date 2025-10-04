import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CoverMatcherService } from './cover-matcher.service';
import { CoverMatcherController } from './cover-matcher.controller';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [CoverMatcherService],
  controllers: [CoverMatcherController],
  exports: [CoverMatcherService],
})
export class CoverMatcherModule {}
