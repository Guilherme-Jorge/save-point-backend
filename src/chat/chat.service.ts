import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Chat } from "./entities/chat.entity";
import { Message } from "./entities/message.entity";
import { User } from "src/user/entities/user.entity";

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Cria um novo chat entre o usuário logado e um destinatário.
   * Evita a criação de chats duplicados.
   * @param currentUserId - ID do usuário que está criando o chat.
   * @param createChatDto - DTO com o ID do destinatário.
   * @returns O chat novo ou o já existente.
   */
  async create(
    userRequestedId: string,
    userDestinationId: string,
  ): Promise<Chat> {
    if (userRequestedId === userDestinationId) {
      throw new BadRequestException("You can't create a chat with yourself");
    }

    const recipient = await this.userRepository.findOneBy({
      id: userDestinationId,
    });
    if (!recipient) {
      throw new NotFoundException("User not founded.");
    }

    const existingChat = await this.chatRepository.findOne({
      where: [
        { user1: { id: userRequestedId }, user2: { id: userDestinationId } },
        { user1: { id: userDestinationId }, user2: { id: userRequestedId } },
      ],
    });

    if (existingChat) {
      throw new BadRequestException("This chat already exists.");
    }

    const currentUser = await this.userRepository.findOneBy({
      id: userRequestedId,
    });

    if (!currentUser) {
      throw new BadRequestException("User not founded");
    }

    const newChat = this.chatRepository.create({
      user1: currentUser,
      user2: recipient,
      lastMessage: "",
    });

    return this.chatRepository.save(newChat);
  }

  async findUserChats(userId: string): Promise<Chat[]> {
    return this.chatRepository.find({
      where: [{ user1: { id: userId } }, { user2: { id: userId } }],
      relations: ["user1", "user2"],
      order: {
        createdAt: "DESC",
      },
    });
  }

  async findChatMessages(chatId: string, userId: string): Promise<Message[]> {
    const chat = await this.chatRepository.findOne({
      where: [
        { id: chatId, user1: { id: userId } },
        { id: chatId, user2: { id: userId } },
      ],
    });

    if (!chat) {
      throw new NotFoundException("Chat not founded");
    }

    return this.messageRepository.find({
      where: { chat: { id: chatId } },
      relations: ["userSender"],
      order: {
        createdAt: "ASC",
      },
    });
  }

  async sendMessage(chatId: string, userId: string, message: string) {
    let chat = await this.chatRepository.findOne({
      where: [
        { id: chatId, user1: { id: userId } },
        { id: chatId, user2: { id: userId } },
      ],
    });

    if (!chat) {
      throw new NotFoundException("Chat not founded");
    }

    chat.lastMessage = message;
    chat = await this.chatRepository.save(chat);

    const user = await this.userRepository.findOneBy({
      id: userId,
    });

    if (!user) {
      throw new NotFoundException("User not founded.");
    }

    const newMessage = this.messageRepository.create({
      chat: chat,
      content: message,
      userSender: user,
    });

    return this.messageRepository.save(newMessage);
  }
}
