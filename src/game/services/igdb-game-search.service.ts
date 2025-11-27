import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { IgdbGame, IgdbGameInterface } from "src/shared/models/igdb-game";
import { IgdbAuthService } from "src/shared/services/igdb-auth.service";

@Injectable()
export class IgdbGameSearchService {
  private readonly logger = new Logger(IgdbGameSearchService.name);
  private readonly endpoint = "https://api.igdb.com/v4/games";
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
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly igdbAuthService: IgdbAuthService,
  ) {}

  private clampLimit(limit: number): number {
    return Math.min(Math.max(Math.floor(limit), 1), 50);
  }

  async searchByKeyword(keyword: string, limit = 20): Promise<IgdbGame[]> {
    const normalizedKeyword = keyword.trim();
    if (!normalizedKeyword) {
      return [];
    }

    const sanitizedLimit = this.clampLimit(limit);
    const accessToken = await this.igdbAuthService.getAccessToken();

    const headers = {
      "Client-ID": this.configService.get<string>("igdb.clientId"),
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    };

    const escapedKeyword = normalizedKeyword.replace(/"/g, '\\"');
    const query = [
      `search "${escapedKeyword}";`,
      `fields ${this.fields};`,
      `limit ${sanitizedLimit};`,
    ].join("\n");

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.endpoint, query, { headers }),
      );

      const data = response.data as IgdbGameInterface[];
      if (!data?.length) {
        return [];
      }

      return data.map((item) => new IgdbGame(item));
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

    const accessToken = await this.igdbAuthService.getAccessToken();
    const headers = {
      "Client-ID": this.configService.get<string>("igdb.clientId"),
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    };

    const query = [
      `where id = (${normalizedIds.join(", ")});`,
      `fields ${this.fields};`,
      `limit ${normalizedIds.length};`,
    ].join("\n");

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.endpoint, query, { headers }),
      );
      const data = response.data as IgdbGameInterface[];
      if (!data?.length) {
        return [];
      }
      return data.map((item) => new IgdbGame(item));
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
