import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { Game } from "src/game/entities/game.entity";
import { CustomList } from "./entities/custom-list.entity";
import { CustomListItem } from "./entities/custom-list-item.entity";
import { CustomListService } from "./custom-list.service";
import { CustomListController } from "./custom-list.controller";

@Module({
  imports: [TypeOrmModule.forFeature([User, Game, CustomList, CustomListItem])],
  controllers: [CustomListController],
  providers: [CustomListService],
  exports: [CustomListService],
})
export class CustomListModule {}
