import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, In, QueryFailedError, Repository, UpdateResult } from "typeorm";
import { Game } from "./entities/game.entity";
import { CreateGameDto } from "./dto/create-game.dto";
import { UpdateGameDto } from "./dto/update-game.dto";
import { IgdbGame } from "src/shared/models/igdb-game";
import { GameReturn } from "./dto/game-return.dto";
import { IgdbGameImportService } from "./services/igdb-game-import.service";
import { IgdbGameSearchService } from "./services/igdb-game-search.service";

type GameIdRow = { game_id: string };

function getThreshold(length: number): number {
  if (length <= 3) {
    return 0.2;
  }
  if (length <= 6) {
    return 0.15;
  }
  if (length <= 12) {
    return 0.1;
  }
  return 0.1;
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

  async fuzzySearchByName(query: string, limit = 10): Promise<GameReturn[]> {
    let games: Game[];

    const queryBuilder = this.gameRepository
      .createQueryBuilder("game")
      .leftJoinAndSelect("game.genres", "genres")
      .leftJoinAndSelect("genres.genre", "genre")
      .leftJoinAndSelect("game.themes", "themes")
      .leftJoinAndSelect("themes.theme", "theme")
      .leftJoinAndSelect("game.gamemodes", "gamemodes")
      .leftJoinAndSelect("gamemodes.gamemode", "gamemode")
      .leftJoinAndSelect("game.platforms", "platforms")
      .leftJoinAndSelect("platforms.platform", "platform")
      .leftJoinAndSelect("game.artworks", "artworks")
      .leftJoinAndSelect("game.screenshots", "screenshots")
      .leftJoinAndSelect("game.cover", "cover")
      .leftJoinAndSelect("game.companies", "companies")
      .leftJoinAndSelect("companies.company", "company");

    // Use ILIKE for short queries (less than 3 characters) or as fallback
    if (query.length < 3) {
      // First, get game IDs that match the query
      const gameIds = await this.gameRepository
        .createQueryBuilder("game")
        .select("game.id", "game_id")
        .where("game.name ILIKE :query", { query: `%${query}%` })
        .orderBy("game.name", "ASC")
        .limit(limit)
        .getRawMany<GameIdRow>();

      if (gameIds.length > 0) {
        // Then get the full games with relations
        const ids = gameIds.map(({ game_id }) => game_id);
        games = await this.gameRepository.find({
          where: { id: In(ids) },
          relations: [
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
          ],
          order: { name: "ASC" },
        });
      } else {
        games = [];
      }
    } else {
      // Try fuzzy search first for longer queries
      const threshold = getThreshold(query.length);

      // Set pg_trgm similarity threshold for this session
      await this.gameRepository.query("SET pg_trgm.similarity_threshold = 0.1");

      games = await queryBuilder
        .where("game.name % :query", { query })
        .andWhere("similarity(game.name, :query) > :threshold", {
          query,
          threshold,
        })
        .orderBy("similarity(game.name, :query)", "DESC")
        .limit(limit)
        .getMany();

      // If no results with fuzzy search, fallback to ILIKE
      if (games.length === 0) {
        // First, get game IDs that match the query
        const gameIds = await this.gameRepository
          .createQueryBuilder("game")
          .select("game.id", "game_id")
          .where("game.name ILIKE :query", { query: `%${query}%` })
          .orderBy("game.name", "ASC")
          .limit(limit)
          .getRawMany<GameIdRow>();

        if (gameIds.length > 0) {
          // Then get the full games with relations
          const ids = gameIds.map(({ game_id }) => game_id);
          games = await this.gameRepository.find({
            where: { id: In(ids) },
            relations: [
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
            ],
            order: { name: "ASC" },
          });
        }
      }
    }

    return games.map((game) => new GameReturn(game));
  }

  async fuzzySearchByNameWithIgdbFallback(
    query: string,
    limit = 10,
  ): Promise<GameReturn[]> {
    const dbResults = await this.fuzzySearchByName(query, limit);

    if (dbResults.length) {
      return dbResults;
    }

    const igdbGames = await this.igdbGameSearchService.searchByKeyword(
      query,
      limit,
    );

    if (!igdbGames.length) {
      return [];
    }

    const importedGames: GameReturn[] = [];

    for (const igdbGame of igdbGames) {
      const game = await this.createFromIgdb(igdbGame);
      importedGames.push(game);
    }

    return importedGames;
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

  async findByKeyword(keyword: string, limit = 20): Promise<GameReturn[]> {
    const sanitizedKeyword = keyword ? keyword.trim() : "";

    if (!sanitizedKeyword) {
      throw new BadRequestException("Keyword query is required");
    }

    const normalizedLimit = Math.min(Math.max(limit, 1), 50);
    const existingGames = await this.gameRepository.find({
      where: { name: ILike(`%${sanitizedKeyword}%`) },
      relations: this.detailedRelations,
      order: { name: "ASC" },
    });

    const results: GameReturn[] = [];
    const seenIgdbIds = new Set<number>();

    for (const game of existingGames) {
      const dto = new GameReturn(game);
      if (game.igdbId) {
        seenIgdbIds.add(game.igdbId);
      }
      results.push(dto);
    }

    const igdbGames = await this.igdbGameSearchService.searchByKeyword(
      sanitizedKeyword,
      normalizedLimit,
    );

    for (const igdbGame of igdbGames) {
      if (seenIgdbIds.has(igdbGame.id)) {
        continue;
      }

      const game = await this.createFromIgdb(igdbGame);
      seenIgdbIds.add(igdbGame.id);
      results.push(game);
    }

    if (!results.length) {
      throw new NotFoundException(
        `Games with keyword "${sanitizedKeyword}" not found`,
      );
    }

    return results;
  }
}
