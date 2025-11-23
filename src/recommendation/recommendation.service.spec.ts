import { Test, TestingModule } from "@nestjs/testing";
import { RecommendationService } from "./recommendation.service";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { IgdbAuthService } from "src/shared/services/igdb-auth.service";
import { GameFromIgdbPipe } from "src/shared/pipes/game-from-igdb.pipe";
import { of } from "rxjs";
import { IgdbGame } from "src/shared/models/igdb-game";
import {
  POPSCORE_RECOMMENDATION_OPTIONS,
  PopScoreRecommendationOptions,
} from "./recommendation.options";
import { PopScorePopularityType } from "./enums/popscore-popularity-type.enum";
import { IgdbDiscoverService } from "./services/igdb-discover.service";
import { TrendingGameDto } from "./dto/trending-game.dto";
import { GameService } from "src/game/game.service";
import { GameReturn } from "src/game/dto/game-return.dto";

describe("RecommendationService", () => {
  let service: RecommendationService;
  let httpService: HttpService;
  let configService: ConfigService;
  let igdbAuthService: IgdbAuthService;
  let gameFromIgdbPipe: GameFromIgdbPipe;
  let igdbDiscoverService: IgdbDiscoverService;
  let gameService: GameService;

  const createGameReturn = (igdbId: number, name?: string): GameReturn =>
    ({
      igdbId,
      id: igdbId.toString(),
      name: name ?? `Game ${igdbId}`,
    } as GameReturn);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: IgdbAuthService,
          useValue: {
            getAccessToken: jest.fn(),
          },
        },
        {
          provide: GameFromIgdbPipe,
          useValue: {
            transform: jest.fn(),
          },
        },
        {
          provide: GameService,
          useValue: {
            createFromIgdb: jest.fn(),
          },
        },
        {
          provide: POPSCORE_RECOMMENDATION_OPTIONS,
          useValue: {
            defaultMetric: PopScorePopularityType.Visits,
          } satisfies PopScoreRecommendationOptions,
        },
        {
          provide: IgdbDiscoverService,
          useValue: {
            fetchTrendingGames: jest.fn(),
            fetchTopRatedGames: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RecommendationService>(RecommendationService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
    igdbAuthService = module.get<IgdbAuthService>(IgdbAuthService);
    gameFromIgdbPipe = module.get<GameFromIgdbPipe>(GameFromIgdbPipe);
    igdbDiscoverService = module.get<IgdbDiscoverService>(IgdbDiscoverService);
    gameService = module.get<GameService>(GameService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns PopScore recommendations using the default metric", async () => {
    (configService.get as jest.Mock).mockImplementation((key: string) => {
      const configMap: Record<string, unknown> = {
        "igdb.clientId": "client-id",
        "igdb.popScore.defaultTypeName": "Visits",
        "igdb.popScore.defaultLimit": 2,
      };

      return configMap[key];
    });

    (igdbAuthService.getAccessToken as jest.Mock).mockResolvedValue(
      "access-token",
    );

    (httpService.post as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("popularity_types")) {
        return of({
          data: [
            {
              id: 1,
              name: "Visits",
              popularity_source: 121,
              updated_at: 1739923772,
            },
          ],
        });
      }

      return of({
        data: [
          {
            id: 10,
            game_id: 100,
            popularity_type: 1,
            value: 0.9,
          },
          {
            id: 11,
            game_id: 200,
            popularity_type: 1,
            value: 0.8,
          },
        ],
      });
    });

    const igdbGameOne = new IgdbGame({
      id: 100,
      name: "Sample Game",
    });
    const igdbGameTwo = new IgdbGame({
      id: 200,
      name: "Second Game",
    });

    const gameReturnOne = createGameReturn(100, "Sample Game");
    const gameReturnTwo = createGameReturn(200, "Second Game");

    (gameFromIgdbPipe.transform as jest.Mock)
      .mockResolvedValueOnce(igdbGameOne)
      .mockResolvedValueOnce(igdbGameTwo);
    (gameService.createFromIgdb as jest.Mock)
      .mockResolvedValueOnce(gameReturnOne)
      .mockResolvedValueOnce(gameReturnTwo);

    const response = await service.getDefaultRecommendations({ limit: 2 });

    expect(response.metric.id).toBe(1);
    expect(response.metric.name).toBe("Visits");
    expect(response.items).toHaveLength(2);
    expect(response.items[0].game).toEqual(gameReturnOne);
    expect(response.items[0].score).toBe(0.9);
    expect(gameFromIgdbPipe.transform).toHaveBeenCalledWith("100");
    expect(gameService.createFromIgdb).toHaveBeenCalledTimes(2);
    expect(httpService.post).toHaveBeenCalledTimes(2);
  });

  it("returns trending games from IGDB discover service", async () => {
    const trending: TrendingGameDto[] = [
      {
        score: 1.23,
        game: createGameReturn(1000, "Game 1"),
      },
    ];

    (igdbDiscoverService.fetchTrendingGames as jest.Mock).mockResolvedValue(
      trending,
    );

    await expect(service.getTrendingGames(5)).resolves.toEqual(trending);
    expect(igdbDiscoverService.fetchTrendingGames).toHaveBeenCalledWith(5);
  });

  it("returns top rated games from IGDB discover service", async () => {
    const topRated: TrendingGameDto[] = [
      {
        score: 9.8,
        game: createGameReturn(2000, "Top Game"),
      },
    ];

    (igdbDiscoverService.fetchTopRatedGames as jest.Mock).mockResolvedValue(
      topRated,
    );

    await expect(service.getTopRatedGames(3)).resolves.toEqual(topRated);
    expect(igdbDiscoverService.fetchTopRatedGames).toHaveBeenCalledWith(3);
  });

  it("returns personalized games filtered by genres", async () => {
    (configService.get as jest.Mock).mockReturnValue("client-id");
    (igdbAuthService.getAccessToken as jest.Mock).mockResolvedValue(
      "access-token",
    );

    (httpService.post as jest.Mock).mockReturnValue(
      of({
        data: [
          { id: 20, game_id: 500, popularity_type: 2, value: 0.9 },
          { id: 21, game_id: 600, popularity_type: 2, value: 0.8 },
        ],
      }),
    );

    const matchGame = new IgdbGame({
      id: 500,
      name: "Genre Match",
      genres: [{ id: 5, name: "Shooter" }],
      first_release_date: Math.floor(Date.now() / 1000) - 3600,
    });
    const noMatchGame = new IgdbGame({
      id: 600,
      name: "Non Match",
      genres: [{ id: 31, name: "Adventure" }],
      first_release_date: Math.floor(Date.now() / 1000) - 7200,
    });

    (gameFromIgdbPipe.transform as jest.Mock)
      .mockResolvedValueOnce(matchGame)
      .mockResolvedValueOnce(noMatchGame);
    const matchGameReturn = createGameReturn(500, "Genre Match");
    const noMatchGameReturn = createGameReturn(600, "Non Match");
    (gameService.createFromIgdb as jest.Mock)
      .mockResolvedValueOnce(matchGameReturn)
      .mockResolvedValueOnce(noMatchGameReturn);

    const response = await service.getPersonalizedRecommendations({
      limit: 1,
      genreIds: [5],
    });

    expect(response).toHaveLength(1);
    expect(response[0].game).toEqual(matchGameReturn);
    expect(httpService.post).toHaveBeenCalled();
  });

  it("returns upcoming personalized games", async () => {
    const currentSeconds = Math.floor(Date.now() / 1000);
    const futureGame = new IgdbGame({
      id: 800,
      name: "Upcoming Game",
      first_release_date: currentSeconds + 86400,
      genres: [{ id: 5, name: "Shooter" }],
    });
    const pastGame = new IgdbGame({
      id: 801,
      name: "Released Game",
      first_release_date: currentSeconds - 86400,
      genres: [{ id: 5, name: "Shooter" }],
    });

    (configService.get as jest.Mock).mockReturnValue("client-id");
    (igdbAuthService.getAccessToken as jest.Mock).mockResolvedValue(
      "access-token",
    );
    (httpService.post as jest.Mock).mockReturnValue(
      of({
        data: [
          { id: 100, game_id: 800, popularity_type: 2, value: 1 },
          { id: 101, game_id: 801, popularity_type: 2, value: 0.5 },
        ],
      }),
    );

    (gameFromIgdbPipe.transform as jest.Mock)
      .mockResolvedValueOnce(futureGame)
      .mockResolvedValueOnce(pastGame);
    const futureGameReturn = createGameReturn(800, "Upcoming Game");
    const pastGameReturn = createGameReturn(801, "Released Game");
    (gameService.createFromIgdb as jest.Mock)
      .mockResolvedValueOnce(futureGameReturn)
      .mockResolvedValueOnce(pastGameReturn);

    const result = await service.getPersonalizedUpcomingRecommendations({
      limit: 2,
      genreIds: [5],
    });

    expect(result).toHaveLength(1);
    expect(result[0].game.igdbId).toBe(800);
  });

  it("returns released personalized games", async () => {
    const currentSeconds = Math.floor(Date.now() / 1000);
    const futureGame = new IgdbGame({
      id: 900,
      name: "Upcoming",
      first_release_date: currentSeconds + 86400,
    });
    const pastGame = new IgdbGame({
      id: 901,
      name: "Released",
      first_release_date: currentSeconds - 86400,
    });

    (configService.get as jest.Mock).mockReturnValue("client-id");
    (igdbAuthService.getAccessToken as jest.Mock).mockResolvedValue(
      "access-token",
    );
    (httpService.post as jest.Mock).mockReturnValue(
      of({
        data: [
          { id: 200, game_id: 900, popularity_type: 2, value: 1 },
          { id: 201, game_id: 901, popularity_type: 2, value: 0.5 },
        ],
      }),
    );

    (gameFromIgdbPipe.transform as jest.Mock)
      .mockResolvedValueOnce(futureGame)
      .mockResolvedValueOnce(pastGame);
    const upcomingGameReturn = createGameReturn(900, "Upcoming");
    const releasedGameReturn = createGameReturn(901, "Released");
    (gameService.createFromIgdb as jest.Mock)
      .mockResolvedValueOnce(upcomingGameReturn)
      .mockResolvedValueOnce(releasedGameReturn);

    const result = await service.getPersonalizedRecommendations({
      limit: 2,
    });

    expect(result).toHaveLength(1);
    expect(result[0].game.igdbId).toBe(901);
  });
});
