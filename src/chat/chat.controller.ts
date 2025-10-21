import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { ChatMessagesDto } from "./dto/chat-messages.dto";
import { CreateChatDto } from "./dto/create-chat.dto";

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  create(@Body() createChatDto: CreateChatDto) {
    return this.chatService.create(
      createChatDto.userRequestedId,
      createChatDto.userDestinationId,
    );
  }

  @Get(":userId")
  findUserChats(@Param("userId") userId: string) {
    return this.chatService.findUserChats(userId);
  }

  @Post("messages/:chatId")
  findChatMessages(
    @Param("chatId") chatId: string,
    @Body() chatMessagesDto: ChatMessagesDto,
  ) {
    return this.chatService.findChatMessages(chatId, chatMessagesDto.userId);
  }
}
