import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PipeTransform,
} from '@nestjs/common';
import { IgdbGame, IgdbGameInterface } from '../models/igdb-game';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GameFromIgdbPipe
  implements PipeTransform<string, Promise<IgdbGame>>
{
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async transform(value: string): Promise<IgdbGame> {
    const id = parseInt(value);
    if (isNaN(id)) {
      throw new BadRequestException(`Invalid number: ${value}`);
    }

    const query = `
      fields id,
             name,
             summary,
             first_release_date,
             platforms.id,
             platforms.name,
             genres.id,
             genres.name,
             themes.id,
             themes.name,
             game_modes.id,
             game_modes.name,
             involved_companies.id,
             involved_companies.developer,
             involved_companies.publisher,
             involved_companies.company.id,
             involved_companies.company.name,
             artworks.id,
             artworks.image_id,
             screenshots.id,
             screenshots.image_id,
             cover.id,
             cover.image_id;
      where id = ${id};
    `;

    const headers = {
      'Client-ID': this.configService.get<string>('igdb.clientId'),
      Authorization: `Bearer ${this.configService.get<string>('igdb.accessToken')}`,
      Accept: 'application/json',
    };

    try {
      // Send POST request to IGDB
      const response = await firstValueFrom(
        this.httpService.post('https://api.igdb.com/v4/games', query, {
          headers,
        }),
      );

      const responseData = response.data as IgdbGameInterface[];
      if (!responseData[0]) {
        throw new NotFoundException(`Game with id ${id} not found in IGDB`);
      }

      // Select the only result from the array
      const gameData = new IgdbGame(responseData[0]);
      if (!gameData) {
        throw new NotFoundException(`Game with id ${id} not found in IGDB`);
      }

      return gameData;
    } catch (error) {
      console.error('Error fetching game details:', error);
      throw error;
    }
  }
}
