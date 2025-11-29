import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PipeTransform,
} from "@nestjs/common";
import { IgdbGame } from "../models/igdb-game";
import { IgdbGameSearchService } from "src/game/services/igdb-game-search.service";

@Injectable()
export class GameFromIgdbPipe
  implements PipeTransform<string, Promise<IgdbGame>>
{
  constructor(
    private readonly igdbGameSearchService: IgdbGameSearchService,
  ) {}

  async transform(value: string): Promise<IgdbGame> {
    const id = parseInt(value);
    if (isNaN(id)) {
      throw new BadRequestException(`Invalid number: ${value}`);
    }

    const game = await this.igdbGameSearchService.fetchById(id);
    if (!game) {
      throw new NotFoundException(`Game with id ${id} not found in IGDB`);
    }

    return game;
  }
}
