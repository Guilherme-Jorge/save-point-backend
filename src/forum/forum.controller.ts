import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import { ForumService } from "./forum.service";
import { CreateTopicDto } from "./dto/create-topic.dto";
import { CreateTopicMessageDto } from "./dto/create-topic-message.dto";

@Controller("forums")
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  // Topics
  @Get("game/:gameId/topics")
  getTopicsByGame(@Param("gameId", ParseUUIDPipe) gameId: string) {
    return this.forumService.getTopicsByGame(gameId);
  }

  @Post("game/:gameId/user/:userId/topics")
  createTopic(
    @Param("gameId", ParseUUIDPipe) gameId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
    @Body() createTopicDto: CreateTopicDto,
  ) {
    return this.forumService.createTopic(gameId, userId, createTopicDto);
  }

  @Get("topics/:topicId/messages")
  getMessagesByTopic(@Param("topicId", ParseUUIDPipe) topicId: string) {
    return this.forumService.getMessagesByTopic(topicId);
  }

  @Post("topics/:topicId/user/:userId/messages")
  addMessageToTopic(
    @Param("topicId", ParseUUIDPipe) topicId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
    @Body() createMessageDto: CreateTopicMessageDto,
  ) {
    return this.forumService.addMessageToTopic(
      topicId,
      userId,
      createMessageDto,
    );
  }
}
