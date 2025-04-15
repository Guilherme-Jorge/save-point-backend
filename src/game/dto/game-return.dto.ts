interface GameReturnInterface {
  id?: string;
  igdbId: number;
  name: string;
  summary?: string;
  releaseDate?: string;
}

export class GameReturn {
  constructor(game: GameReturnInterface) {
    this.id = game.id;
    this.igdbId = game.igdbId;
    this.name = game.name;
    this.summary = game.summary;
    this.releaseDate = game.releaseDate;
  }

  id?: string;

  igdbId: number;

  name: string;

  summary?: string;

  releaseDate?: string;
}
