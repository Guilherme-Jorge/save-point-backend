import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Forum } from "./entities/forum.entity";
import { Topic } from "./entities/topic.entity";
import { TopicMessage } from "./entities/topic-message.entity";
import { ForumController } from "./forum.controller";
import { ForumService } from "./forum.service";
import { Game } from "src/game/entities/game.entity";
import { User } from "src/user/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Forum, Topic, TopicMessage, Game, User])],
  controllers: [ForumController],
  providers: [ForumService],
})
export class ForumModule {}
