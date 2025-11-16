import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, QueryFailedError, Repository, UpdateResult } from "typeorm";
import { Game } from "./entities/game.entity";
import { CreateGameDto } from "./dto/create-game.dto";
import { UpdateGameDto } from "./dto/update-game.dto";
import { IgdbGame } from "src/shared/models/igdb-game";
import { GameReturn } from "./dto/game-return.dto";
import { IgdbGameImportService } from "./services/igdb-game-import.service";
import { IgdbGameSearchService } from "./services/igdb-game-search.service";

function getThreshold(length: number): number {
  if (length <= 3) {
    return 0.4;
  }
  if (length <= 6) {
    return 0.35;
  }
  if (length <= 12) {
    return 0.3;
  }
  return 0.25;
}

@Injectable()
export class GameService {
  private readonly detailedRelations = [
    "genres",
    "genres.genre",
    "themes",
    "themes.theme",
    "gamemodes",
    "gamemodes.gamemode",
    "platforms",
    "platforms.platform",
    "artworks",
    "screenshots",
    "cover",
    "companies",
    "companies.company",
    "achievements",
  ];

  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    private readonly igdbGameImportService: IgdbGameImportService,
    private readonly igdbGameSearchService: IgdbGameSearchService,
  ) {}

  /**
   *
   * @param createGameDto
   * @returns
   */
  async create(createGameDto: CreateGameDto): Promise<Game> {
    return this.gameRepository.save(createGameDto);
  }

  async createFromIgdb(igdbGame: IgdbGame): Promise<GameReturn> {
    const existingGame = await this.findByIgdbIdWithRelations(igdbGame.id);

    if (existingGame) {
      return new GameReturn(existingGame);
    }

    try {
      return await this.igdbGameImportService.importFromIgdb(igdbGame);
    } catch (error) {
      if (this.isUniqueConstraintViolation(error)) {
        const persistedGame = await this.findByIgdbIdWithRelations(igdbGame.id);

        if (persistedGame) {
          return new GameReturn(persistedGame);
        }
      }

      throw error;
    }
  }

  private async findByIgdbIdWithRelations(
    igdbId: number,
  ): Promise<Game | null> {
    return this.gameRepository.findOne({
      where: { igdbId },
      relations: this.detailedRelations,
    });
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as { code?: string } | undefined;
    return driverError?.code === "23505";
  }

  async findAll(): Promise<GameReturn[]> {
    const games = await this.gameRepository.find({
      relations: this.detailedRelations,
    });
    if (!games) {
      throw new NotFoundException("Games not found");
    }

    const gameReturn: GameReturn[] = [];

    games.map((game) => gameReturn.push(new GameReturn(game)));

    return gameReturn;
  }

  async fuzzySeachByName(query: string, limit = 10): Promise<GameReturn[]> {
    const threshold = getThreshold(query.length);

    const games = await this.gameRepository
      .createQueryBuilder("game")
      .where("game.name % :query", { query })
      .andWhere("similarity(game.name, :name) > :threshold", {
        query,
        threshold,
      })
      .orderBy("similarity(game.name, :query)", "DESC")
      .limit(limit)
      .getMany();
    const gameReturn: GameReturn[] = [];
    games.map((game) => gameReturn.push(new GameReturn(game)));

    return gameReturn;
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

  async findByKeyword(keyword: string): Promise<GameReturn> {
    const sanitizedKeyword = keyword ? keyword.trim() : "";

    if (!sanitizedKeyword) {
      throw new BadRequestException("Keyword query is required");
    }

    const existingGame = await this.gameRepository.findOne({
      where: { name: ILike(`%${sanitizedKeyword}%`) },
      relations: this.detailedRelations,
    });

    if (existingGame) {
      return new GameReturn(existingGame);
    }

    const igdbGame =
      await this.igdbGameSearchService.searchByKeyword(sanitizedKeyword);

    if (!igdbGame) {
      throw new NotFoundException(
        `Game with keyword "${sanitizedKeyword}" not found`,
      );
    }

    return this.igdbGameImportService.importFromIgdb(igdbGame);
  }
}
