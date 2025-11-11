import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, FindOptionsWhere, Repository } from "typeorm";
import { Game } from "../entities/game.entity";
import {
  IgdbGame,
  IgdbAttributeInterface,
  IgdbImageInterface,
  InvolvedCompanyInterface,
} from "src/shared/models/igdb-game";
import { GameReturn } from "../dto/game-return.dto";
import { Genre } from "../entities/genre.entity";
import { GameGenre } from "../entities/game-genre.entity";
import { Theme } from "../entities/theme.entity";
import { GameTheme } from "../entities/game-theme.entity";
import { Gamemode } from "../entities/gamemode.entity";
import { GameGamemode } from "../entities/game-gamemode.entity";
import { Platform } from "../entities/platform.entity";
import { GamePlatform } from "../entities/game-platform.entity";
import { Artwork } from "../entities/artwork.entity";
import { Screenshot } from "../entities/screenshot.entity";
import { Cover } from "../entities/cover.entity";
import { Company } from "../entities/company.entity";
import { InvolvedCompany } from "../entities/involved-company.entity";
import { CompanyRoles } from "../enums/company-roles.enum";

@Injectable()
export class IgdbGameImportService {
  private readonly relations = [
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
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(GameGenre)
    private readonly gameGenreRepository: Repository<GameGenre>,
    @InjectRepository(Theme)
    private readonly themeRepository: Repository<Theme>,
    @InjectRepository(GameTheme)
    private readonly gameThemeRepository: Repository<GameTheme>,
    @InjectRepository(Gamemode)
    private readonly gamemodeRepository: Repository<Gamemode>,
    @InjectRepository(GameGamemode)
    private readonly gameGamemodeRepository: Repository<GameGamemode>,
    @InjectRepository(Platform)
    private readonly platformRepository: Repository<Platform>,
    @InjectRepository(GamePlatform)
    private readonly gamePlatformRepository: Repository<GamePlatform>,
    @InjectRepository(Artwork)
    private readonly artworkRepository: Repository<Artwork>,
    @InjectRepository(Screenshot)
    private readonly screenshotRepository: Repository<Screenshot>,
    @InjectRepository(Cover)
    private readonly coverRepository: Repository<Cover>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(InvolvedCompany)
    private readonly involvedCompanyRepository: Repository<InvolvedCompany>,
  ) {}

  async importFromIgdb(igdbGame: IgdbGame): Promise<GameReturn> {
    const game = await this.createGameEntity(igdbGame);

    await this.syncGenres(game, igdbGame.genres);
    await this.syncThemes(game, igdbGame.themes);
    await this.syncGamemodes(game, igdbGame.game_modes);
    await this.syncPlatforms(game, igdbGame.platforms);
    await this.syncArtworks(game, igdbGame.artworks);
    await this.syncScreenshots(game, igdbGame.screenshots);
    await this.syncCover(game, igdbGame.cover);
    await this.syncInvolvedCompanies(game, igdbGame.involvedCompanies);

    const fullGame = await this.loadFullGame(game.id);

    if (!fullGame) {
      throw new NotFoundException(
        `Game with id ${game.id} not found after save`,
      );
    }

    return new GameReturn(fullGame);
  }

  private async createGameEntity(igdbGame: IgdbGame): Promise<Game> {
    const game = this.gameRepository.create({
      igdbId: igdbGame.id,
      name: igdbGame.name,
      summary: igdbGame.summary,
      releaseDate: igdbGame.firstReleaseDate,
    });

    return this.gameRepository.save(game);
  }

  private async syncGenres(
    game: Game,
    genres?: IgdbAttributeInterface[],
  ): Promise<void> {
    if (!genres?.length) {
      return;
    }

    for (const genreData of genres) {
      const genre = await this.getOrCreateAttribute(
        this.genreRepository,
        genreData,
      );
      const gameGenre = this.gameGenreRepository.create({ game, genre });
      await this.gameGenreRepository.save(gameGenre);
    }
  }

  private async syncThemes(
    game: Game,
    themes?: IgdbAttributeInterface[],
  ): Promise<void> {
    if (!themes?.length) {
      return;
    }

    for (const themeData of themes) {
      const theme = await this.getOrCreateAttribute(
        this.themeRepository,
        themeData,
      );
      const gameTheme = this.gameThemeRepository.create({ game, theme });
      await this.gameThemeRepository.save(gameTheme);
    }
  }

  private async syncGamemodes(
    game: Game,
    gamemodes?: IgdbAttributeInterface[],
  ): Promise<void> {
    if (!gamemodes?.length) {
      return;
    }

    for (const gamemodeData of gamemodes) {
      const gamemode = await this.getOrCreateAttribute(
        this.gamemodeRepository,
        gamemodeData,
      );
      const gameGamemode = this.gameGamemodeRepository.create({
        game,
        gamemode,
      });
      await this.gameGamemodeRepository.save(gameGamemode);
    }
  }

  private async syncPlatforms(
    game: Game,
    platforms?: IgdbAttributeInterface[],
  ): Promise<void> {
    if (!platforms?.length) {
      return;
    }

    for (const platformData of platforms) {
      const platform = await this.getOrCreateAttribute(
        this.platformRepository,
        platformData,
      );
      const gamePlatform = this.gamePlatformRepository.create({
        game,
        platform,
      });
      await this.gamePlatformRepository.save(gamePlatform);
    }
  }

  private async syncArtworks(
    game: Game,
    artworks?: IgdbImageInterface[],
  ): Promise<void> {
    if (!artworks?.length) {
      return;
    }

    for (const artworkData of artworks) {
      const artwork = this.artworkRepository.create({
        igdbId: artworkData.id,
        imageId: artworkData.image_id,
        url: artworkData.url,
        game,
      });
      await this.artworkRepository.save(artwork);
    }
  }

  private async syncScreenshots(
    game: Game,
    screenshots?: IgdbImageInterface[],
  ): Promise<void> {
    if (!screenshots?.length) {
      return;
    }

    for (const screenshotData of screenshots) {
      const screenshot = this.screenshotRepository.create({
        igdbId: screenshotData.id,
        imageId: screenshotData.image_id,
        url: screenshotData.url,
        game,
      });
      await this.screenshotRepository.save(screenshot);
    }
  }

  private async syncCover(
    game: Game,
    cover?: IgdbImageInterface,
  ): Promise<void> {
    if (!cover) {
      return;
    }

    const gameCover = this.coverRepository.create({
      igdbId: cover.id,
      imageId: cover.image_id,
      url: cover.url,
      game,
    });

    await this.coverRepository.save(gameCover);
  }

  private async syncInvolvedCompanies(
    game: Game,
    companies?: InvolvedCompanyInterface[],
  ): Promise<void> {
    if (!companies?.length) {
      return;
    }

    for (const companyData of companies) {
      const company = await this.getOrCreateAttribute(
        this.companyRepository,
        companyData.company,
      );
      const involvedCompany = this.involvedCompanyRepository.create({
        role: this.resolveCompanyRole(companyData),
        game,
        company,
      });
      await this.involvedCompanyRepository.save(involvedCompany);
    }
  }

  private resolveCompanyRole(company: InvolvedCompanyInterface): CompanyRoles {
    if (company.developer) {
      return CompanyRoles.DEVELOPER;
    }

    return CompanyRoles.PUBLISHER;
  }

  private async getOrCreateAttribute<
    T extends { igdbId: number; name: string },
  >(repository: Repository<T>, attribute: IgdbAttributeInterface): Promise<T> {
    const where = { igdbId: attribute.id } as FindOptionsWhere<T>;
    const existing = await repository.findOne({ where });

    if (existing) {
      return existing;
    }

    const entity = repository.create({
      igdbId: attribute.id,
      name: attribute.name,
    } as DeepPartial<T>);

    return repository.save(entity);
  }

  private async loadFullGame(gameId: string): Promise<Game | null> {
    return this.gameRepository.findOne({
      where: { id: gameId },
      relations: this.relations,
    });
  }
}
