import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AxiosError, isAxiosError } from "axios";
import Bottleneck from "bottleneck";
import { firstValueFrom } from "rxjs";
import { IgdbAuthService } from "../services/igdb-auth.service";

type RequestExecutor<T> = () => Promise<T>;

@Injectable()
export class IgdbHttpGateway {
  private static readonly baseUrl = "https://api.igdb.com";
  private static readonly maxRetries = 5;
  private static readonly initialBackoffMs = 500;
  private static readonly maxBackoffMs = 5000;
  private readonly limiter: Bottleneck;
  private readonly logger = new Logger(IgdbHttpGateway.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly igdbAuthService: IgdbAuthService,
  ) {
    this.limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 350,
      reservoir: 3,
      reservoirRefreshAmount: 3,
      reservoirRefreshInterval: 1000,
    });
  }

  async postGames<T = unknown>(body: string): Promise<T> {
    return this.post<T>("/v4/games", body);
  }

  async post<T = unknown>(path: string, body: string): Promise<T> {
    return this.schedule(() => this.performRequest<T>(path, body));
  }

  private schedule<T>(executor: RequestExecutor<T>): Promise<T> {
    return this.limiter.schedule(executor);
  }

  private async performRequest<T>(path: string, body: string): Promise<T> {
    const clientId = this.configService.get<string>("igdb.clientId");
    if (!clientId) {
      throw new Error("IGDB clientId configuration is missing");
    }

    const url = `${IgdbHttpGateway.baseUrl}${path}`;
    const accessToken = await this.igdbAuthService.getAccessToken();

    const headers = {
      "Client-ID": clientId,
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "text/plain",
    };

    return this.executeWithRetry(async () => {
      const response = await firstValueFrom(
        this.httpService.post<T>(url, body, {
          headers,
          timeout: 5000,
        }),
      );
      return response.data;
    });
  }

  private async executeWithRetry<T>(executor: RequestExecutor<T>): Promise<T> {
    let attempt = 0;
    let backoff = IgdbHttpGateway.initialBackoffMs;

    while (true) {
      try {
        return await executor();
      } catch (error) {
        attempt += 1;

        if (!this.shouldRetry(error, attempt)) {
          throw error;
        }

        const retryAfter = this.parseRetryAfterMs(error);
        const sleepDuration = retryAfter ?? backoff;

        this.logger.warn(
          `IGDB request failed (attempt ${attempt}) – retrying in ${sleepDuration} ms`,
        );

        await this.delay(sleepDuration);

        backoff = Math.min(backoff * 2, IgdbHttpGateway.maxBackoffMs);
      }
    }
  }

  private shouldRetry(error: unknown, attempt: number): boolean {
    if (attempt >= IgdbHttpGateway.maxRetries) {
      return false;
    }

    if (!isAxiosError(error)) {
      return true;
    }

    if (!error.response) {
      return true;
    }

    const status = error.response.status;
    return status === 429 || (status >= 500 && status < 600);
  }

  private parseRetryAfterMs(error: unknown): number | undefined {
    if (!isAxiosError(error)) {
      return undefined;
    }

    const retryAfter = error.response?.headers?.["retry-after"];
    if (!retryAfter) {
      return undefined;
    }

    const parsedSeconds = Number(retryAfter);
    if (Number.isFinite(parsedSeconds)) {
      return parsedSeconds * 1000;
    }

    const dateValue = Date.parse(retryAfter);
    if (Number.isFinite(dateValue)) {
      const delta = dateValue - Date.now();
      return delta > 0 ? delta : undefined;
    }

    return undefined;
  }

  private delay(duration: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, duration);
    });
  }
}

