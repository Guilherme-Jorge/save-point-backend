import { ImageSizes } from 'src/game/enums/image-sizes.enum';

export interface IgdbGameInterface {
  id: number;
  artworks?: IgdbImageInterface[];
  cover?: IgdbImageInterface;
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
  image_id: string;
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
      if (!img.image_id) {
        return img;
      }

      return {
        id: img.id,
        image_id: img.image_id,
        url: `https://images.igdb.com/igdb/image/upload/t_{size}/${img.image_id}.jpg`,
        // urls: this.buildImageUrls(img.image_id),
      };
    });

    this.cover = game.cover
      ? ({
          id: game.cover.id,
          image_id: game.cover.image_id,
          url: `https://images.igdb.com/igdb/image/upload/t_{size}/${game.cover.image_id}.jpg`,
        } as IgdbImageInterface)
      : undefined;

    this.firstReleaseDate = game.first_release_date
      ? new Date(game.first_release_date * 1000)
      : undefined;
    this.game_modes = game.game_modes;
    this.genres = game.genres;
    this.involvedCompanies = game.involved_companies;
    this.name = game.name;
    this.platforms = game.platforms;

    this.screenshots = game.screenshots?.map((img) => {
      if (!img.image_id) {
        return img;
      }

      return {
        id: img.id,
        image_id: img.image_id,
        url: `https://images.igdb.com/igdb/image/upload/t_{size}/${img.image_id}.jpg`,
        // urls: this.buildImageUrls(img.image_id),
      };
    });

    this.summary = game.summary;
    this.themes = game.themes;
  }

  // private buildImageUrls(hash: string): ImageSizeMap {
  //   return Object.values(ImageSizes).reduce((acc, size) => {
  //     acc[size] = `https://images.igdb.com/igdb/image/upload/t_${size}/${hash}.jpg`;
  //     return acc;
  //   }, {} as ImageSizeMap);
  // }

  id: number;
  artworks?: IgdbImageInterface[];
  cover?: IgdbImageInterface;
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
