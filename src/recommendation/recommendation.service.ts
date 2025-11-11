import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { IgdbGameInterface } from "src/shared/models/igdb-game";
import { RecommendationDto } from "./dto/recommendation.dto";
import { IgdbAuthService } from "src/shared/services/igdb-auth.service";

interface PopScorePrimitive {
  game: number;
  value: number;
}

interface PopScoreType {
  id: number;
  slug: string;
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  private popScoreTypeId?: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly igdbAuthService: IgdbAuthService,
  ) {}

  async getDefaultRecommendations(limit = 20): Promise<RecommendationDto[]> {
    this.logger.debug(`Fetching default recommendations with limit: ${limit}`);

    const { games, popScoreMap } = await this.fetchPopScoreGames(limit);

    return this.mapIgdbGamesToRecommendations(games, popScoreMap);
  }

  async getTrendingGames(limit = 20): Promise<RecommendationDto[]> {
    this.logger.debug(`Fetching trending games with limit: ${limit}`);

    const games = await this.fetchTrendingGamesFromIgdb(limit);

    return this.mapIgdbGamesToRecommendations(games);
  }

  async getTopRatedGames(limit = 20): Promise<RecommendationDto[]> {
    this.logger.debug(`Fetching top rated games with limit: ${limit}`);

    const games = await this.fetchTopRatedGamesFromIgdb(limit);

    return this.mapIgdbGamesToRecommendations(games);
  }

  async getRecommendationsByGenre(
    genreIds: number[],
    limit = 20,
  ): Promise<RecommendationDto[]> {
    this.logger.debug(
      `Fetching recommendations by genre (${genreIds.join(", ")}) with limit: ${limit}`,
    );

    const games = await this.fetchGamesByGenreFromIgdb(genreIds, limit);

    return this.mapIgdbGamesToRecommendations(games);
  }

  private async fetchPopScoreGames(limit: number) {
    const popScoreTypeId = await this.getPopScoreTypeId();

    const primitives = await this.executeIgdbQuery<PopScorePrimitive[]>(
      "popularity_primitives",
      `
      fields game,
             value;
      where popularity_type = ${popScoreTypeId}
        & game != null;
      sort value desc;
      limit ${limit};
    `,
    );

    const gameIds = primitives
      .map((primitive) => primitive.game)
      .filter((id, index, arr) => id != null && arr.indexOf(id) === index);

    if (gameIds.length === 0) {
      return { games: [], popScoreMap: {} as Record<number, number> };
    }

    const games = await this.fetchGamesByIds(gameIds);

    const popScoreMap = primitives.reduce<Record<number, number>>(
      (acc, primitive) => {
        if (primitive.game != null && acc[primitive.game] === undefined) {
          acc[primitive.game] = primitive.value;
        }
        return acc;
      },
      {},
    );

    return { games, popScoreMap };
  }

  private async getPopScoreTypeId(): Promise<number> {
    if (this.popScoreTypeId) {
      return this.popScoreTypeId;
    }

    const response = await this.executeIgdbQuery<PopScoreType[]>(
      "popularity_types",
      `
      fields id,
             slug;
      where slug = "popscore";
      limit 1;
    `,
    );

    const popScoreType = response[0];

    if (!popScoreType) {
      throw new Error("PopScore popularity type not found in IGDB");
    }

    this.popScoreTypeId = popScoreType.id;

    return this.popScoreTypeId;
  }

  private async fetchPopularGamesFromIgdb(
    limit: number,
  ): Promise<IgdbGameInterface[]> {
    const query = `
      fields id,
             name,
             summary,
             first_release_date,
             cover.id,
             cover.image_id,
             total_rating,
             total_rating_count,
             popularity,
             genres.id,
             genres.name,
             themes.id,
             themes.name,
             platforms.id,
             platforms.name;
      where total_rating_count > 50
        & popularity != null
        & cover != null;
      sort popularity desc;
      limit ${limit};
    `;

    return this.executeIgdbQuery("games", query);
  }

  private async fetchTrendingGamesFromIgdb(
    limit: number,
  ): Promise<IgdbGameInterface[]> {
    const oneYearAgo = Math.floor(Date.now() / 1000) - 31536000;

    const query = `
      fields id,
             name,
             summary,
             first_release_date,
             cover.id,
             cover.image_id,
             total_rating,
             total_rating_count,
             popularity,
             genres.id,
             genres.name,
             themes.id,
             themes.name,
             platforms.id,
             platforms.name;
      where first_release_date != null
        & first_release_date > ${oneYearAgo}
        & total_rating_count > 20
        & popularity != null
        & cover != null;
      sort popularity desc;
      limit ${limit};
    `;

    return this.executeIgdbQuery("games", query);
  }

  private async fetchTopRatedGamesFromIgdb(
    limit: number,
  ): Promise<IgdbGameInterface[]> {
    const query = `
      fields id,
             name,
             summary,
             first_release_date,
             cover.id,
             cover.image_id,
             total_rating,
             total_rating_count,
             popularity,
             genres.id,
             genres.name,
             themes.id,
             themes.name,
             platforms.id,
             platforms.name;
      where total_rating_count > 100
        & total_rating != null
        & cover != null;
      sort total_rating desc;
      limit ${limit};
    `;

    return this.executeIgdbQuery("games", query);
  }

  private async fetchGamesByGenreFromIgdb(
    genreIds: number[],
    limit: number,
  ): Promise<IgdbGameInterface[]> {
    const genreFilter = genreIds.map((id) => `genres = (${id})`).join(" | ");

    const query = `
      fields id,
             name,
             summary,
             first_release_date,
             cover.id,
             cover.image_id,
             total_rating,
             total_rating_count,
             popularity,
             genres.id,
             genres.name,
             themes.id,
             themes.name,
             platforms.id,
             platforms.name;
      where (${genreFilter})
        & total_rating_count > 30
        & total_rating > 70
        & cover != null;
      sort popularity desc;
      limit ${limit};
    `;

    return this.executeIgdbQuery("games", query);
  }

  private async fetchGamesByIds(ids: number[]): Promise<IgdbGameInterface[]> {
    const query = `
      fields id,
             name,
             summary,
             first_release_date,
             cover.id,
             cover.image_id,
             total_rating,
             total_rating_count,
             popularity,
             genres.id,
             genres.name,
             themes.id,
             themes.name,
             platforms.id,
             platforms.name;
      where id = (${ids.join(",")});
      limit ${ids.length};
    `;

    return this.executeIgdbQuery("games", query);
  }

  private async executeIgdbQuery<T>(
    endpoint: string,
    query: string,
  ): Promise<T> {
    const accessToken = await this.igdbAuthService.getAccessToken();

    const headers = {
      "Client-ID": this.configService.get<string>("igdb.clientId"),
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    };

    try {
      this.logger.debug(`Executing IGDB query on endpoint: ${endpoint}`);

      const response = await firstValueFrom(
        this.httpService.post(`https://api.igdb.com/v4/${endpoint}`, query, {
          headers,
        }),
      );

      return response.data as T;
    } catch (error) {
      this.logger.error(`IGDB query failed on endpoint: ${endpoint}`, error);
      throw error;
    }
  }

  private mapIgdbGamesToRecommendations(
    games: IgdbGameInterface[],
    popScoreMap?: Record<number, number>,
  ): RecommendationDto[] {
    return games.map((game) => ({
      igdbId: game.id,
      name: game.name,
      summary: game.summary,
      releaseDate: game.first_release_date
        ? new Date(game.first_release_date * 1000)
        : undefined,
      coverUrl: game.cover
        ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
        : undefined,
      genres:
        game.genres?.map((genre) => ({ id: genre.id, name: genre.name })) ?? [],
      themes:
        game.themes?.map((theme) => ({ id: theme.id, name: theme.name })) ?? [],
      platforms:
        game.platforms?.map((platform) => ({
          id: platform.id,
          name: platform.name,
        })) ?? [],
      rating: (game as unknown as { total_rating?: number }).total_rating,
      ratingCount: (game as unknown as { total_rating_count?: number })
        .total_rating_count,
      popularity: (game as unknown as { popularity?: number }).popularity,
      popScore: popScoreMap?.[game.id],
    }));
  }
}
