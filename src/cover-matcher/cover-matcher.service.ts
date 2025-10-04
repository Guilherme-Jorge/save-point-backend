import { Injectable, HttpException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ConfigService } from "@nestjs/config";
import { AxiosError } from "axios";
import * as FormData from "form-data";

@Injectable()
export class CoverMatcherService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
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
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const status = axiosError?.response?.status ?? 502;
      const payload =
        axiosError?.response?.data ?? "Cover matcher service error";
      throw new HttpException(payload, status);
    }
  }
}
