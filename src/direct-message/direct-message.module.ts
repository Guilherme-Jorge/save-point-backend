import { Module } from '@nestjs/common';
import { DirectMessageService } from './direct-message.service';
import { DirectMessageGateway } from './direct-message.gateway';

@Module({
  providers: [DirectMessageGateway, DirectMessageService],
})
export class DirectMessageModule {}
