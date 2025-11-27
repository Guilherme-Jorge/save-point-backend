import { Injectable, HttpException, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ConfigService } from "@nestjs/config";
import { AxiosError } from "axios";
import * as FormData from "form-data";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Game } from "src/game/entities/game.entity";
import { GameService } from "src/game/game.service";
import { IgdbGameSearchService } from "src/game/services/igdb-game-search.service";

type CoverMatcherEntry = Record<string, unknown> & {
  igdbId?: number;
  id?: string;
};

type CoverMatcherResult = Record<string, unknown> & {
  match?: CoverMatcherEntry;
  alternatives: CoverMatcherEntry[];
  base?: CoverMatcherEntry | null;
};

@Injectable()
export class CoverMatcherService {
  private readonly logger = new Logger(CoverMatcherService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    private readonly gameService: GameService,
    private readonly igdbGameSearchService: IgdbGameSearchService,
  ) {}

  async searchCover(fileBuffer: Buffer, filename: string): Promise<any> {
    const url = this.config.get<string>(
      "COVER_MATCHER_URL",
      "http://cover-matcher:8000/search-cover",
    );

    const form = new FormData();
    form.append("file", fileBuffer, { filename });

    try {
      const response = await firstValueFrom(
        this.http.post(url, form, {
          headers: form.getHeaders(),
          timeout: 30000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }),
      );
      const normalized = this.normalizeResult(response.data);
      return await this.enrichWithDatabase(normalized);
    } catch (error) {
      const axiosError = error as AxiosError;
      const status = axiosError?.response?.status ?? 502;
      const payload =
        axiosError?.response?.data ?? "Cover matcher service error";
      throw new HttpException(payload, status);
    }
  }

  private normalizeResult(data: unknown): CoverMatcherResult {
    if (!data || typeof data !== "object") {
      return { alternatives: [] };
    }

    const payload = {
      ...(data as Record<string, unknown>),
    } as CoverMatcherResult;
    payload.alternatives = Array.isArray(
      (data as Record<string, unknown>).alternatives,
    )
      ? ((data as Record<string, unknown>).alternatives as unknown[]).map(
          (item) => {
            const normalized = this.normalizeEntry(item);
            return normalized ?? (item as CoverMatcherEntry);
          },
        )
      : [];

    const matchEntry = this.normalizeEntry(
      (data as Record<string, unknown>).match,
    );
    if (matchEntry) {
      payload.match = matchEntry;
    } else if ("match" in payload) {
      const originalMatch = (data as Record<string, unknown>).match;
      payload.match = originalMatch as CoverMatcherEntry;
    }

    const baseValue = (data as Record<string, unknown>).base;
    if (baseValue === null) {
      payload.base = null;
    } else if (baseValue !== undefined) {
      const normalizedBase = this.normalizeEntry(baseValue);
      payload.base = normalizedBase ?? (baseValue as CoverMatcherEntry);
    }

    return payload;
  }

  private normalizeEntry(entry: unknown): CoverMatcherEntry | undefined {
    if (!entry || typeof entry !== "object") {
      return undefined;
    }

    const { id, ...rest } = entry as Record<string, unknown>;
    const normalized = { ...rest } as CoverMatcherEntry;
    if (id !== undefined) {
      const numericId = typeof id === "number" ? id : Number(id);
      if (Number.isFinite(numericId)) {
        normalized.igdbId = numericId;
      }
    }
    return normalized;
  }

  private collectEntries(result: CoverMatcherResult): CoverMatcherEntry[] {
    const entries: CoverMatcherEntry[] = [];
    if (result.match && typeof result.match === "object") {
      entries.push(result.match);
    }
    for (const alt of result.alternatives ?? []) {
      if (alt && typeof alt === "object") {
        entries.push(alt);
      }
    }
    if (result.base && typeof result.base === "object") {
      entries.push(result.base);
    }
    return entries;
  }

  private collectIgdbIds(entries: CoverMatcherEntry[]): Set<number> {
    const ids = new Set<number>();
    for (const entry of entries) {
      if (typeof entry.igdbId === "number") {
        ids.add(entry.igdbId);
      }
    }
    return ids;
  }

  private async enrichWithDatabase(
    result: CoverMatcherResult,
  ): Promise<CoverMatcherResult> {
    const entries = this.collectEntries(result);
    if (!entries.length) {
      return result;
    }

    const igdbIds = this.collectIgdbIds(entries);
    if (!igdbIds.size) {
      return result;
    }

    const existingGames = await this.gameRepository.find({
      where: { igdbId: In([...igdbIds]) },
      select: ["id", "igdbId"],
    });
    const idMap = new Map<number, string>();
    for (const game of existingGames) {
      if (game.igdbId) {
        idMap.set(game.igdbId, game.id);
      }
    }

    const missingIds = [...igdbIds].filter((id) => !idMap.has(id));
    if (missingIds.length) {
      try {
        const igdbGames =
          await this.igdbGameSearchService.fetchByIds(missingIds);
        for (const igdbGame of igdbGames) {
          if (!igdbGame) {
            continue;
          }
          try {
            const importedGame =
              await this.gameService.createFromIgdb(igdbGame);
            if (importedGame?.igdbId && importedGame.id) {
              idMap.set(importedGame.igdbId, importedGame.id);
            }
          } catch {
            continue;
          }
        }
      } catch (error) {
        this.logger.warn(
          "Failed to fetch or import one or more IGDB games",
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    for (const entry of entries) {
      if (typeof entry.igdbId !== "number") {
        continue;
      }
      const gameId = idMap.get(entry.igdbId);
      if (gameId) {
        entry.id = gameId;
      }
    }

    return result;
  }
}
