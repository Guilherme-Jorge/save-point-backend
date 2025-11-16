import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

@Injectable()
export class IgdbAuthService {
  private readonly logger = new Logger(IgdbAuthService.name);
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private readonly tokenEndpoint = "https://id.twitch.tv/oauth2/token";

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    const bufferTime = 60000;

    if (this.cachedToken && this.tokenExpiresAt > now + bufferTime) {
      return this.cachedToken;
    }

    return this.refreshAccessToken();
  }

  private async refreshAccessToken(): Promise<string> {
    const clientId = this.configService.get<string>("igdb.clientId");
    const clientSecret = this.configService.get<string>("igdb.clientSecret");

    if (!clientId || !clientSecret) {
      throw new Error(
        "IGDB_CLIENT_ID and IGDB_CLIENT_SECRET environment variables must be set",
      );
    }

    try {
      this.logger.debug("Refreshing IGDB access token");

      const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      });

      const response = await firstValueFrom(
        this.httpService.post<TokenResponse>(
          this.tokenEndpoint,
          params.toString(),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          },
        ),
      );

      const { access_token, expires_in } = response.data;

      this.cachedToken = access_token;
      this.tokenExpiresAt = Date.now() + expires_in * 1000;

      this.logger.debug(
        `IGDB access token refreshed successfully. Expires in ${expires_in} seconds`,
      );

      return access_token;
    } catch (error) {
      this.logger.error("Failed to refresh IGDB access token", error);
      throw new Error("Failed to authenticate with IGDB API");
    }
  }
}
