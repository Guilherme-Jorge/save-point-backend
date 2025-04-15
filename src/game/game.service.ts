import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { Repository, UpdateResult } from 'typeorm';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { ConfigService } from '@nestjs/config';
import { IgdbGame } from 'src/shared/models/igdb-game';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    private readonly configService: ConfigService,
  ) {}

  async create(createGameDto: CreateGameDto): Promise<Game> {
    return this.gameRepository.save(createGameDto);
  }

  async createFromIgdb(igdbGame: IgdbGame): Promise<Game> {
    const game = new Game();

    game.igdbId = igdbGame.id;
    game.name = igdbGame.name;

    return this.gameRepository.save(game);
  }

  async findAll(): Promise<Game[]> {
    const games = await this.gameRepository.find();
    if (!games) {
      throw new NotFoundException('Games not found');
    }

    return games;
  }

  async update(
    id: string,
    updateGameDto: UpdateGameDto,
  ): Promise<UpdateResult> {
    return this.gameRepository.update(id, updateGameDto);
  }

  async remove(id: string): Promise<void> {
    await this.gameRepository.delete(id);
  }
}
