import { Module } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { ChatModule } from "src/chat/chat.module";

@Module({
  imports: [ChatModule],
  exports: [],
  controllers: [],
  providers: [ChatGateway],
})
export class GatewayModule {}
