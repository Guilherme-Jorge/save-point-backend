import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { IgdbHttpGateway } from "./igdb-http.gateway";
import { IgdbAuthService } from "../services/igdb-auth.service";
import igdbConfig from "src/config/igdb.config";

@Module({
  imports: [ConfigModule.forFeature(igdbConfig), HttpModule],
  providers: [IgdbHttpGateway, IgdbAuthService],
  exports: [IgdbHttpGateway, IgdbAuthService],
})
export class IgdbModule {}

