import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import {
  DeepPartial,
  FindOptionsWhere,
  Repository,
  UpdateResult,
} from 'typeorm';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { IgdbGame } from 'src/shared/models/igdb-game';
import { Genre } from './entities/genre.entity';
import { GameGenre } from './entities/game-genre.entity';
import { Theme } from './entities/theme.entity';
import { GameTheme } from './entities/game-theme.entity';
import { Gamemode } from './entities/gamemode.entity';
import { GameGamemode } from './entities/game-gamemode.entity';
import { Platform } from './entities/platform.entity';
import { GamePlatform } from './entities/game-platform.entity';
import { Screenshot } from './entities/screenshot.entity';
import { Cover } from './entities/cover.entity';
import { Company } from './entities/company.entity';
import { InvolvedCompany } from './entities/involved-company.entity';
import { CompanyRoles } from './enums/company-roles.enum';
import { Artwork } from './entities/artwork.entity';
import { GameReturn } from './dto/game-return.dto';

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
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,

    @InjectRepository(Genre)
    private genreRepository: Repository<Genre>,
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

  /**
   *
   * @param createGameDto
   * @returns
   */
  async create(createGameDto: CreateGameDto): Promise<Game> {
    return this.gameRepository.save(createGameDto);
  }

  async createFromIgdb(igdbGame: IgdbGame): Promise<GameReturn> {
    const game = this.gameRepository.create({
      igdbId: igdbGame.id,
      name: igdbGame.name,
      summary: igdbGame.summary,
      releaseDate: igdbGame.firstReleaseDate,
    });

    await this.gameRepository.save(game);

    async function getOrCreateAttribute<
      T extends { igdbId: number; name: string },
    >(repository: Repository<T>, igdbId: number, name: string): Promise<T> {
      const where = {
        igdbId,
      } as unknown as FindOptionsWhere<T>;

      let entity = await repository.findOneBy(where);

      if (!entity) {
        const partial = { igdbId, name } as DeepPartial<T>;
        entity = repository.create(partial);
        await repository.save(entity);
      }

      return entity;
    }

    if (igdbGame.genres) {
      for (const g of igdbGame.genres) {
        const genre = await getOrCreateAttribute(
          this.genreRepository,
          g.id,
          g.name,
        );
        const gameGenre = this.gameGenreRepository.create({ game, genre });
        await this.gameGenreRepository.save(gameGenre);
      }
    }

    if (igdbGame.themes) {
      for (const t of igdbGame.themes) {
        const theme = await getOrCreateAttribute(
          this.themeRepository,
          t.id,
          t.name,
        );
        const gameTheme = this.gameThemeRepository.create({ game, theme });
        await this.gameThemeRepository.save(gameTheme);
      }
    }

    if (igdbGame.game_modes) {
      for (const m of igdbGame.game_modes) {
        const mode = await getOrCreateAttribute(
          this.gamemodeRepository,
          m.id,
          m.name,
        );
        const gameGamemode = this.gameGamemodeRepository.create({
          game,
          gamemode: mode,
        });
        await this.gameGamemodeRepository.save(gameGamemode);
      }
    }

    if (igdbGame.platforms) {
      for (const p of igdbGame.platforms) {
        const platform = await getOrCreateAttribute(
          this.platformRepository,
          p.id,
          p.name,
        );
        const gamePlatform = this.gamePlatformRepository.create({
          game,
          platform,
        });
        await this.gamePlatformRepository.save(gamePlatform);
      }
    }

    if (igdbGame.artworks) {
      for (const a of igdbGame.artworks) {
        const artwork = this.artworkRepository.create({
          igdbId: a.id,
          imageId: a.image_id,
          url: a.url,
          // urls: a.urls,
          game,
        });
        await this.artworkRepository.save(artwork);
      }
    }

    if (igdbGame.screenshots) {
      for (const s of igdbGame.screenshots) {
        const screenshot = this.screenshotRepository.create({
          igdbId: s.id,
          imageId: s.image_id,
          url: s.url,
          // urls: s.urls,
          game,
        });
        await this.screenshotRepository.save(screenshot);
      }
    }

    if (igdbGame.cover) {
      const c = igdbGame.cover;
      const cover = this.coverRepository.create({
        igdbId: c.id,
        imageId: c.image_id,
        url: c.url,
        // urls: c.urls,
        game,
      });

      await this.coverRepository.save(cover);
    }

    if (igdbGame.involvedCompanies) {
      for (const ic of igdbGame.involvedCompanies) {
        const company = await getOrCreateAttribute(
          this.companyRepository,
          ic.company.id,
          ic.company.name,
        );

        let role = CompanyRoles.PUBLISHER;

        if (ic.developer) {
          role = CompanyRoles.DEVELOPER;
        }

        const involvedCompany = this.involvedCompanyRepository.create({
          role: role,
          game,
          company,
        });
        await this.involvedCompanyRepository.save(involvedCompany);
      }
    }

    const fullGame = await this.gameRepository.findOne({
      where: { id: game.id },
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
        'game.cover'
      ],
    });

    if (!fullGame) {
      throw new NotFoundException(
        `Game with id ${game.id} not found after save`,
      );
    }

    return new GameReturn(fullGame);
  }

  async findAll(): Promise<GameReturn[]> {
    const games = await this.gameRepository.find({
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
        'game.cover'
      ],
    });
    if (!games) {
      throw new NotFoundException('Games not found');
    }

    const gameReturn: GameReturn[] = [];

    games.map((game) => gameReturn.push(new GameReturn(game)));

    return gameReturn;
  }

  async fuzzySeachByName(query: string, limit = 10): Promise<GameReturn[]> {
    const threshold = getThreshold(query.length);

    const games = await this.gameRepository
      .createQueryBuilder('game')
      .where('game.name % :query', { query })
      .andWhere('similarity(game.name, :name) > :threshold', {
        query,
        threshold,
      })
      .orderBy('similarity(game.name, :query)', 'DESC')
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
}
