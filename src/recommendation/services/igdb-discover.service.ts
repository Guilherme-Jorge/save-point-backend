import { HttpService } from "@nestjs/axios";
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { TrendingGameDto } from "../dto/trending-game.dto";
import { GameFromIgdbPipe } from "src/shared/pipes/game-from-igdb.pipe";
import { PopScorePopularityType } from "../enums/popscore-popularity-type.enum";
import { IgdbAuthService } from "src/shared/services/igdb-auth.service";
import { ConfigService } from "@nestjs/config";
import { GameService } from "src/game/game.service";

interface PopScorePrimitiveResponse {
  game_id: number;
  popularity_type: number;
  value: number;
}

@Injectable()
export class IgdbDiscoverService {
  private readonly logger = new Logger(IgdbDiscoverService.name);
  private readonly popularityPrimitivesEndpoint =
    "https://api.igdb.com/v4/popularity_primitives";

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly igdbAuthService: IgdbAuthService,
    private readonly gameFromIgdbPipe: GameFromIgdbPipe,
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
      const response = await firstValueFrom(
        this.httpService.post<PopScorePrimitiveResponse[]>(
          this.popularityPrimitivesEndpoint,
          query,
          {
            headers: await this.buildHeaders(),
          },
        ),
      );

      const primitives = response.data;

      return Promise.all(
        primitives.map(async (primitive) => {
          const igdbGame = await this.gameFromIgdbPipe.transform(
            primitive.game_id.toString(),
          );
          const game = await this.gameService.createFromIgdb(igdbGame);

          return {
            score: primitive.value,
            game,
          };
        }),
      );
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

  private async buildHeaders() {
    const clientId = this.configService.get<string>("igdb.clientId");
    const accessToken = await this.igdbAuthService.getAccessToken();

    if (!clientId) {
      throw new ServiceUnavailableException(
        "IGDB client configuration is missing",
      );
    }

    return {
      "Client-ID": clientId,
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "text/plain",
    };
  }
}
