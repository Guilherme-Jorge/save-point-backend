import { ImageSizes } from 'src/game/enums/image-sizes.enum';

export interface IgdbGameInterface {
  id: number;
  artworks?: IgdbImageInterface[];
  first_release_date?: number;
  game_modes?: IgdbAttributeInterface[];
  genres?: IgdbAttributeInterface[];
  involved_companies?: InvolvedCompanyInterface[];
  name: string;
  platforms?: IgdbAttributeInterface[];
  screenshots?: IgdbImageInterface[];
  summary?: string;
  themes?: IgdbAttributeInterface[];
}

export type ImageSizeMap = Record<ImageSizes, string>;

export interface IgdbImageInterface {
  id: number;
  url?: string;
  // urls?: ImageSizeMap;
}

export interface IgdbAttributeInterface {
  id: number;
  name: string;
}

export interface InvolvedCompanyInterface {
  id: number;
  company: IgdbAttributeInterface;
  developer: boolean;
  publisher: boolean;
}

export class IgdbGame {
  constructor(game: IgdbGameInterface) {
    this.id = game.id;

    this.artworks = game.artworks?.map((img) => {
      if (!img.url) {
        return img;
      }

      const hash = this.extractHash(img.url);

      return {
        id: img.id,
        url: `https://images.igdb.com/igdb/image/upload/t_{size}/${hash}`,
        // urls: this.buildImageUrls(hash),
      };
    });

    this.firstReleaseDate = game.first_release_date
      ? new Date(game.first_release_date * 1000)
      : undefined;
    this.game_modes = game.game_modes;
    this.genres = game.genres;
    this.involvedCompanies = game.involved_companies;
    this.name = game.name;
    this.platforms = game.platforms;

    this.screenshots = game.screenshots?.map((img) => {
      if (!img.url) {
        return img;
      }

      const hash = this.extractHash(img.url);

      return {
        id: img.id,
        url: `https://images.igdb.com/igdb/image/upload/t_{size}/${hash}`,
        // urls: this.buildImageUrls(hash),
      };
    });

    this.summary = game.summary;
    this.themes = game.themes;
  }

  private extractHash(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1];
  }

  // private buildImageUrls(hash: string): ImageSizeMap {
  //   return Object.values(ImageSizes).reduce((acc, size) => {
  //     acc[size] = `https://images.igdb.com/igdb/image/upload/t_${size}/${hash}`;
  //     return acc;
  //   }, {} as ImageSizeMap);
  // }

  id: number;

  artworks?: IgdbImageInterface[];

  firstReleaseDate?: Date;

  game_modes?: IgdbAttributeInterface[];

  genres?: IgdbAttributeInterface[];

  involvedCompanies?: InvolvedCompanyInterface[];

  name: string;

  platforms?: IgdbAttributeInterface[];

  screenshots?: IgdbImageInterface[];

  summary?: string;

  themes?: IgdbAttributeInterface[];
}
