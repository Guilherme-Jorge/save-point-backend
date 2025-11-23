import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Forum } from "./entities/forum.entity";
import { Topic } from "./entities/topic.entity";
import { TopicMessage } from "./entities/topic-message.entity";
import { Game } from "src/game/entities/game.entity";
import { User } from "src/user/entities/user.entity";
import { CreateTopicDto } from "./dto/create-topic.dto";
import { CreateTopicMessageDto } from "./dto/create-topic-message.dto";

@Injectable()
export class ForumService {
  constructor(
    @InjectRepository(Forum)
    private readonly forumRepository: Repository<Forum>,
    @InjectRepository(Topic)
    private readonly topicRepository: Repository<Topic>,
    @InjectRepository(TopicMessage)
    private readonly topicMessageRepository: Repository<TopicMessage>,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOrCreateForumByGame(gameId: string): Promise<Forum> {
    let forum = await this.forumRepository.findOne({
      where: { game: { id: gameId } },
    });
    if (!forum) {
      const game = await this.gameRepository.findOneBy({ id: gameId });
      if (!game) {
        throw new NotFoundException(`Game with id ${gameId} not found`);
      }
      forum = this.forumRepository.create({ game });
      await this.forumRepository.save(forum);
    }
    return forum;
  }

  async createTopic(
    gameId: string,
    userId: string,
    createTopicDto: CreateTopicDto,
  ): Promise<any> {
    const forum = await this.findOrCreateForumByGame(gameId);
    const owner = await this.userRepository.findOneBy({ id: userId });
    if (!owner) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const topic = this.topicRepository.create({
      title: createTopicDto.title,
      forum,
      owner,
    });
    const savedTopic = await this.topicRepository.save(topic);

    const initialMessage = this.topicMessageRepository.create({
      message: createTopicDto.message,
      topic: savedTopic,
      author: owner,
    });
    await this.topicMessageRepository.save(initialMessage);

    const response = {
      id: savedTopic.id,
      title: savedTopic.title,
      createdAt: savedTopic.createdAt,
      updatedAt: savedTopic.updatedAt,
      forum: {
        id: savedTopic.forum.id,
      },
      owner: {
        id: savedTopic.owner.id,
        username: savedTopic.owner.username,
      },
    };

    return response;
  }

  async getTopicsByGame(gameId: string): Promise<any[]> {
    const forum = await this.findOrCreateForumByGame(gameId);
    const topics = await this.topicRepository.find({
      where: { forum: { id: forum.id } },
      relations: ["owner", "messages"],
      order: {
        updatedAt: "DESC",
      },
    });

    return topics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt,
      messageCount: topic.messages.length,
      owner: {
        id: topic.owner.id,
        username: topic.owner.username,
      },
    }));
  }

  async getTopicsById(topicId: string): Promise<any> {
    const topic = await this.topicRepository.find({
      where: {
        id: topicId
      },
      relations: ["owner", "messages"]
    });

    if (!topic) {
      throw new NotFoundException(`Topic with id ${topicId} not found`);
    }

    return {
      id: topic[0].id,
      title: topic[0].title,
      createdAt: topic[0].createdAt,
      updatedAt: topic[0].updatedAt,
      messageCount: topic[0].messages.length,
      owner: {
        id: topic[0].owner.id,
        username: topic[0].owner.username,
      }
    }
  }

  async addMessageToTopic(
    topicId: string,
    userId: string,
    createMessageDto: CreateTopicMessageDto,
  ): Promise<any> {
    const topic = await this.topicRepository.findOneBy({ id: topicId });
    if (!topic) {
      throw new NotFoundException(`Topic with id ${topicId} not found`);
    }

    const author = await this.userRepository.findOneBy({ id: userId });
    if (!author) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const message = this.topicMessageRepository.create({
      ...createMessageDto,
      topic,
      author,
    });

    await this.topicRepository.update(topicId, { updatedAt: new Date() });

    const savedMessage = await this.topicMessageRepository.save(message);

    return {
      id: savedMessage.id,
      message: savedMessage.message,
      createdAt: savedMessage.createdAt,
      author: {
        id: savedMessage.author.id,
        username: savedMessage.author.username,
      },
    };
  }

  async getMessagesByTopic(topicId: string): Promise<any[]> {
    const messages = await this.topicMessageRepository.find({
      where: { topic: { id: topicId } },
      relations: ["author"],
      order: {
        createdAt: "ASC",
      },
    });

    return messages.map((message) => ({
      id: message.id,
      message: message.message,
      createdAt: message.createdAt,
      author: {
        id: message.author.id,
        username: message.author.username,
      },
    }));
  }
}