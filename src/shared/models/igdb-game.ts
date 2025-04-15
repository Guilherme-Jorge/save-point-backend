export interface IgdbGameInterface {
  id: number;
  artworks?: IgdbImageInterface[];
  firstReleaseDate?: number;
  game_modes?: IgdbAttributeInterface[];
  genres?: IgdbAttributeInterface[];
  involvedCompanies?: InvolvedCompanyInterface[];
  name: string;
  platforms?: IgdbAttributeInterface[];
  screenshots?: IgdbImageInterface[];
  summary?: string;
  themes?: IgdbAttributeInterface[];
}

export interface IgdbImageInterface {
  id: number;
  url: string;
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
    this.artworks = game.artworks;
    this.firstReleaseDate = game.firstReleaseDate
      ? new Date(game.firstReleaseDate * 1000)
      : undefined;
    this.game_modes = game.game_modes;
    this.genres = game.genres;
    this.involvedCompanies = game.involvedCompanies;
    this.name = game.name;
    this.platforms = game.platforms;
    this.screenshots = game.screenshots;
    this.summary = game.summary;
    this.themes = game.themes;
  }

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
