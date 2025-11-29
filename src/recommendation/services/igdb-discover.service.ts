import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { TrendingGameDto } from "../dto/trending-game.dto";
import { PopScorePopularityType } from "../enums/popscore-popularity-type.enum";
import { GameService } from "src/game/game.service";
import { IgdbHttpGateway } from "src/shared/http/igdb-http.gateway";
import { IgdbGameSearchService } from "src/game/services/igdb-game-search.service";

interface PopScorePrimitiveResponse {
  game_id: number;
  popularity_type: number;
  value: number;
}

@Injectable()
export class IgdbDiscoverService {
  private readonly logger = new Logger(IgdbDiscoverService.name);
  private readonly popularityPrimitivesPath = "/v4/popularity_primitives";

  constructor(
    private readonly igdbHttpGateway: IgdbHttpGateway,
    private readonly igdbGameSearchService: IgdbGameSearchService,
    private readonly gameService: GameService,
  ) {}

  async fetchTrendingGames(limit: number): Promise<TrendingGameDto[]> {
    return this.fetchAndEnrichGames(
      PopScorePopularityType.Visits,
      limit,
      "trending",
    );
  }

  async fetchTopRatedGames(limit: number): Promise<TrendingGameDto[]> {
    return this.fetchAndEnrichGames(
      PopScorePopularityType.PositiveReviews,
      limit,
      "top-rated",
    );
  }

  private async fetchAndEnrichGames(
    popularityType: PopScorePopularityType,
    limit: number,
    logNamespace: string,
  ): Promise<TrendingGameDto[]> {
    const query = `fields game_id,value,popularity_type; sort value desc; limit ${limit}; where popularity_type = ${popularityType};`;

    try {
      const primitives = await this.igdbHttpGateway.post<
        PopScorePrimitiveResponse[]
      >(this.popularityPrimitivesPath, query);

      if (!primitives?.length) {
        return [];
      }

      const uniqueIds = Array.from(
        new Set(primitives.map((primitive) => primitive.game_id)),
      );

      const igdbGames = await this.igdbGameSearchService.fetchByIds(uniqueIds);
      const igdbGameMap = new Map(igdbGames.map((game) => [game.id, game]));

      const results: TrendingGameDto[] = [];

      for (const primitive of primitives) {
        const igdbGame = igdbGameMap.get(primitive.game_id);
        if (!igdbGame) {
          this.logger.warn(
            `Missing IGDB game ${primitive.game_id} for ${logNamespace}`,
          );
          continue;
        }

        const game = await this.gameService.createFromIgdb(igdbGame);
        results.push({
          score: primitive.value,
          game,
        });
      }

      return results;
    } catch (error) {
      this.logger.error(
        `Failed to fetch ${logNamespace} IGDB PopScore games`,
        error,
      );
      throw new ServiceUnavailableException(
        `Unable to retrieve ${logNamespace} games from IGDB`,
      );
    }
  }
}
