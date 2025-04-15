import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PipeTransform,
} from '@nestjs/common';
import { Game } from '../entities/game.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { validate as isUuid } from 'uuid';

@Injectable()
export class GameByIdPipe implements PipeTransform<string, Promise<Game>> {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
  ) {}

  async transform(value: string): Promise<Game> {
    if (!isUuid(value)) {
      throw new BadRequestException(`Invalid UUID: ${value}`);
    }

    const game = await this.gameRepository.findOne({ where: { id: value } });
    if (!game) {
      throw new NotFoundException(`Game with id ${value} not found`);
    }

    return game;
  }
}
