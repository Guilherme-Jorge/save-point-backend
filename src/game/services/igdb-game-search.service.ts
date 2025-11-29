import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { IgdbGame, IgdbGameInterface } from "src/shared/models/igdb-game";
import { IgdbHttpGateway } from "src/shared/http/igdb-http.gateway";

@Injectable()
export class IgdbGameSearchService {
  private readonly logger = new Logger(IgdbGameSearchService.name);
  private readonly fields = [
    "id",
    "name",
    "summary",
    "first_release_date",
    "platforms.id",
    "platforms.name",
    "genres.id",
    "genres.name",
    "themes.id",
    "themes.name",
    "game_modes.id",
    "game_modes.name",
    "involved_companies.id",
    "involved_companies.developer",
    "involved_companies.publisher",
    "involved_companies.company.id",
    "involved_companies.company.name",
    "artworks.id",
    "artworks.image_id",
    "screenshots.id",
    "screenshots.image_id",
    "cover.id",
    "cover.image_id",
  ].join(", ");

  constructor(
    private readonly igdbHttpGateway: IgdbHttpGateway,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private buildCacheKey(...parts: (string | number)[]): string {
    return ["igdb", ...parts].join(":");
  }

  private async cacheGetOrSet<T>(
    key: string,
    factory: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.cache.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    await this.cache.set(key, value ?? null);
    return value;
  }

  private clampLimit(limit: number): number {
    return Math.min(Math.max(Math.floor(limit), 1), 50);
  }

  async searchByKeyword(keyword: string, limit = 20): Promise<IgdbGame[]> {
    const normalizedKeyword = keyword.trim();
    if (!normalizedKeyword) {
      return [];
    }

    const sanitizedLimit = this.clampLimit(limit);

    const escapedKeyword = normalizedKeyword.replace(/"/g, '\\"');
    const query = [
      `search "${escapedKeyword}";`,
      `fields ${this.fields};`,
      `limit ${sanitizedLimit};`,
    ].join("\n");

    const cacheKey = this.buildCacheKey(
      "search",
      escapedKeyword.toLowerCase(),
      sanitizedLimit,
    );

    try {
      const data = await this.cacheGetOrSet(cacheKey, async () => {
        const response = await this.igdbHttpGateway.postGames<
          IgdbGameInterface[]
        >(query);
        return response?.length ? response.map((item) => new IgdbGame(item)) : [];
      });
      return data;
    } catch (error) {
      this.logger.error(
        `Failed to search IGDB for keyword ${normalizedKeyword}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException("Failed to search IGDB dataset");
    }
  }

  async fetchByIds(ids: number[]): Promise<IgdbGame[]> {
    const normalizedIds = Array.from(
      new Set(ids.filter((id) => Number.isInteger(id) && id > 0)),
    );
    if (!normalizedIds.length) {
      return [];
    }

    const query = [
      `where id = (${normalizedIds.join(", ")});`,
      `fields ${this.fields};`,
      `limit ${normalizedIds.length};`,
    ].join("\n");

    const cacheKey = this.buildCacheKey(
      "ids",
      normalizedIds.sort((a, b) => a - b).join(","),
    );

    try {
      const data = await this.cacheGetOrSet(cacheKey, async () => {
        const response = await this.igdbHttpGateway.postGames<
          IgdbGameInterface[]
        >(query);
        return response?.length ? response.map((item) => new IgdbGame(item)) : [];
      });
      return data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch IGDB games for ids ${normalizedIds.join(", ")}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        "Failed to fetch IGDB games by id",
      );
    }
  }

  async fetchById(id: number): Promise<IgdbGame | null> {
    const [game] = await this.fetchByIds([id]);
    return game ?? null;
  }
}
