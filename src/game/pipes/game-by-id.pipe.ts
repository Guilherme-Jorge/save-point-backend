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
import { GameReturn } from '../dto/game-return.dto';

@Injectable()
export class GameByIdPipe
  implements PipeTransform<string, Promise<GameReturn>>
{
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
  ) {}

  async transform(value: string): Promise<GameReturn> {
    if (!isUuid(value)) {
      throw new BadRequestException(`Invalid UUID: ${value}`);
    }

    const game = await this.gameRepository.findOne({
      where: { id: value },
      relations: [
        'genres',
        'genres.genre',
        'themes',
        'themes.theme',
        'gamemodes',
        'gamemodes.gamemode',
        'platforms',
        'platforms.platform',
        'artworks',
        'screenshots',
        'cover',
        'companies',
        'companies.company',
        'achievements',
      ],
    });
    if (!game) {
      throw new NotFoundException(`Game with id ${value} not found`);
    }
    const gameReturn = new GameReturn(game);

    return gameReturn;
  }
}
