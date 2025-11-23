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

  @Get("topics/:gameId")
  getTopicsByGame(@Param("gameId", ParseUUIDPipe) gameId: string) {
    return this.forumService.getTopicsByGame(gameId);
  }

  @Get("topic/:topicId")
  getTopicsById(@Param("topicId", ParseUUIDPipe) topicId: string) {
    return this.forumService.getTopicsById(topicId);
  }

  @Post("game/:gameId/user/:userId/topics")
  createTopic(
    @Param("gameId", ParseUUIDPipe) gameId: string,
    @Param("userId", ParseUUIDPipe) userId: string,
    @Body() createTopicDto: CreateTopicDto,
  ) {
    return this.forumService.createTopic(gameId, userId, createTopicDto);
  }
  
  @Post("topics/create")
  createTopic(@Body() createTopicDto: CreateTopicDto) {
    return this.forumService.createTopic(createTopicDto);
  }

  @Get("topics/messages/:topicId")
  getMessagesByTopic(@Param("topicId", ParseUUIDPipe) topicId: string) {
    return this.forumService.getMessagesByTopic(topicId);
  }

  @Post("topics/messages")
  SendMessageToTopic(@Body() createMessageDto: CreateTopicMessageDto) {
    return this.forumService.SendMessageToTopic(createMessageDto);
  }
}
