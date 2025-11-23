import { GameReturn } from "src/game/dto/game-return.dto";

export interface TrendingGameDto {
  readonly score: number;
  readonly game: GameReturn;
}
