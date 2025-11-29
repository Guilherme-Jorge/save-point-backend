import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  PopScorePopularityMetricDto,
  PopScoreRecommendationItemDto,
  PopScoreRecommendationResponseDto,
} from "./dto/popscore-recommendation.dto";
import {
  POPSCORE_RECOMMENDATION_OPTIONS,
  PopScoreRecommendationOptions,
} from "./recommendation.options";
import { IgdbDiscoverService } from "./services/igdb-discover.service";
import { TrendingGameDto } from "./dto/trending-game.dto";
import { PopScorePopularityType } from "./enums/popscore-popularity-type.enum";
import { IgdbGame } from "src/shared/models/igdb-game";
import { GameService } from "src/game/game.service";
import { GameReturn } from "src/game/dto/game-return.dto";
import { IgdbHttpGateway } from "src/shared/http/igdb-http.gateway";
import { IgdbGameSearchService } from "src/game/services/igdb-game-search.service";

interface PopScorePopularityTypeResponse {
  id: number;
  popularity_source: number;
  name: string;
  updated_at: number;
}

interface PopScorePrimitiveResponse {
  id: number;
  game_id: number;
  popularity_type: number;
  value: number;
}

interface RecommendationRequestOptions {
  limit?: number;
}

interface PersonalizedRecommendationFilters
  extends RecommendationRequestOptions {
  genreIds?: number[];
}

interface PersonalizedScheduleFilters
  extends PersonalizedRecommendationFilters {
  releaseType: "upcoming" | "released";
}

interface EnrichedRecommendationItem {
  readonly score: number;
  readonly igdbGame: IgdbGame;
  readonly storedGame: GameReturn;
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  private readonly popularityTypesPath = "/v4/popularity_types";
  private readonly popularityPrimitivesPath = "/v4/popularity_primitives";
  private readonly popularityTypesQuery =
    "fields name,popularity_source,updated_at; sort id asc;";
  private readonly defaultLimit = 10;
  private readonly maxLimit = 50;

  constructor(
    private readonly igdbHttpGateway: IgdbHttpGateway,
    private readonly igdbGameSearchService: IgdbGameSearchService,
    private readonly gameService: GameService,
    private readonly igdbDiscoverService: IgdbDiscoverService,
    @Inject(POPSCORE_RECOMMENDATION_OPTIONS)
    private readonly options: PopScoreRecommendationOptions,
  ) {}

  async getDefaultRecommendations(
    requestOptions?: RecommendationRequestOptions,
  ): Promise<PopScoreRecommendationResponseDto> {
    const limit = this.resolveLimit(requestOptions?.limit);
    const metric = await this.resolveDefaultMetric();
    const primitives = await this.fetchPopularityPrimitives(metric.id, limit);
    const enrichedItems = await this.enrichGamesWithScores(primitives);

    return {
      metric,
      items: this.mapToRecommendationItems(enrichedItems),
    };
  }

  async getTrendingGames(limit: number): Promise<TrendingGameDto[]> {
    return this.igdbDiscoverService.fetchTrendingGames(limit);
  }

  async getTopRatedGames(limit: number): Promise<TrendingGameDto[]> {
    return this.igdbDiscoverService.fetchTopRatedGames(limit);
  }

  async getPersonalizedRecommendations(
    filters: PersonalizedRecommendationFilters,
  ): Promise<TrendingGameDto[]> {
    return this.buildPersonalizedRecommendations({
      ...filters,
      releaseType: "released",
    });
  }

  async getPersonalizedUpcomingRecommendations(
    filters: PersonalizedRecommendationFilters,
  ): Promise<TrendingGameDto[]> {
    return this.buildPersonalizedRecommendations({
      ...filters,
      releaseType: "upcoming",
    });
  }

  private async buildPersonalizedRecommendations(
    filters: PersonalizedScheduleFilters,
  ): Promise<TrendingGameDto[]> {
    const limit = this.resolveLimit(filters.limit);
    const fetchLimit = Math.min(this.maxLimit, limit * 3);
    const primitives = await this.fetchPopularityPrimitives(
      PopScorePopularityType.WantToPlay,
      fetchLimit,
    );
    const enrichedItems = await this.enrichGamesWithScores(primitives);
    const releaseFiltered = this.filterGamesByReleaseWindow(
      enrichedItems,
      filters.releaseType,
    );
    const genreFiltered = this.filterGamesByGenres(
      releaseFiltered,
      filters.genreIds,
    );

    return this.mapToTrendingItems(genreFiltered.slice(0, limit));
  }

  private async resolveDefaultMetric(): Promise<PopScorePopularityMetricDto> {
    const metrics = await this.fetchPopularityTypes();
    const configuredId = this.normaliseNumber(this.options.defaultMetric);
    const metric =
      (configuredId &&
        metrics.find((item) => Number(item.id) === configuredId)) ??
      metrics[0];

    if (!metric) {
      throw new ServiceUnavailableException(
        "Default PopScore metric could not be resolved",
      );
    }

    return metric;
  }

  private async fetchPopularityTypes(): Promise<PopScorePopularityMetricDto[]> {
    try {
      const response = await this.igdbHttpGateway.post<
        PopScorePopularityTypeResponse[]
      >(this.popularityTypesPath, this.popularityTypesQuery);

      return response.map((type) => this.mapPopularityType(type));
    } catch (error) {
      this.logError("Failed to fetch PopScore popularity types", error);
      throw new ServiceUnavailableException(
        "Unable to retrieve popularity metrics from IGDB",
      );
    }
  }

  private async fetchPopularityPrimitives(
    popularityTypeId: number,
    limit: number,
  ): Promise<PopScorePrimitiveResponse[]> {
    const query = `fields game_id,value,popularity_type; sort value desc; limit ${limit}; where popularity_type = ${popularityTypeId};`;

    try {
      return this.igdbHttpGateway.post<PopScorePrimitiveResponse[]>(
        this.popularityPrimitivesPath,
        query,
      );
    } catch (error) {
      this.logError(
        `Failed to fetch PopScore primitives for metric ${popularityTypeId}`,
        error,
      );
      throw new ServiceUnavailableException(
        "Unable to retrieve popularity rankings from IGDB",
      );
    }
  }

  private async enrichGamesWithScores(
    primitives: PopScorePrimitiveResponse[],
  ): Promise<EnrichedRecommendationItem[]> {
    if (!primitives.length) {
      return [];
    }

    const uniqueIds = Array.from(
      new Set(primitives.map((primitive) => primitive.game_id)),
    );

    const igdbGames = await this.igdbGameSearchService.fetchByIds(uniqueIds);
    const igdbGameMap = new Map(igdbGames.map((game) => [game.id, game]));

    const items: EnrichedRecommendationItem[] = [];

    for (const primitive of primitives) {
      const igdbGame = igdbGameMap.get(primitive.game_id);
      if (!igdbGame) {
        this.logger.warn(`Missing IGDB game ${primitive.game_id}`);
        continue;
      }

      const storedGame = await this.gameService.createFromIgdb(igdbGame);

      items.push({
        score: primitive.value,
        igdbGame,
        storedGame,
      });
    }

    return items;
  }

  private mapToRecommendationItems(
    items: EnrichedRecommendationItem[],
  ): PopScoreRecommendationItemDto[] {
    return items.map(({ score, storedGame }) => ({
      score,
      game: storedGame,
    }));
  }

  private mapToTrendingItems(
    items: EnrichedRecommendationItem[],
  ): TrendingGameDto[] {
    return items.map(({ score, storedGame }) => ({
      score,
      game: storedGame,
    }));
  }

  private mapPopularityType(
    type: PopScorePopularityTypeResponse,
  ): PopScorePopularityMetricDto {
    const timestamp =
      typeof type.updated_at === "number" && !Number.isNaN(type.updated_at)
        ? type.updated_at * 1000
        : Date.now();

    return {
      id: type.id,
      name: type.name,
      popularitySource: type.popularity_source,
      updatedAt: new Date(timestamp).toISOString(),
    };
  }

  private resolveLimit(limit?: number): number {
    const resolved = this.normaliseNumber(limit);

    if (!resolved) {
      return this.defaultLimit;
    }

    return Math.max(1, Math.min(this.maxLimit, resolved));
  }

  private normaliseNumber(value?: number): number | undefined {
    if (typeof value !== "number") {
      return undefined;
    }

    if (!Number.isFinite(value)) {
      return undefined;
    }

    return value;
  }

  private logError(message: string, error: unknown) {
    if (error instanceof Error) {
      this.logger.error(message, error.stack);
      return;
    }

    this.logger.error(message);
  }

  private filterGamesByGenres(
    items: EnrichedRecommendationItem[],
    genreIds?: number[],
  ) {
    if (!genreIds || genreIds.length === 0) {
      return items;
    }

    const genreSet = new Set(genreIds);

    return items.filter((item) =>
      this.gameMatchesGenres(item.igdbGame, genreSet),
    );
  }

  private gameMatchesGenres(game: IgdbGame, genreIds: Set<number>) {
    return game.genres?.some((genre) => genreIds.has(genre.id)) ?? false;
  }

  private filterGamesByReleaseWindow(
    items: EnrichedRecommendationItem[],
    releaseType: PersonalizedScheduleFilters["releaseType"],
  ) {
    const now = Date.now();

    if (releaseType === "upcoming") {
      return items.filter((item) => {
        const releaseDate = item.igdbGame.firstReleaseDate?.getTime();
        return releaseDate !== undefined && releaseDate > now;
      });
    }

    return items.filter((item) => {
      const releaseDate = item.igdbGame.firstReleaseDate?.getTime();
      return releaseDate !== undefined && releaseDate <= now;
    });
  }
}
