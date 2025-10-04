import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Game } from "./game.entity";
import { Genre } from "./genre.entity";

@Entity()
export class GameGenre {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Game, (game) => game.genres, { onDelete: "CASCADE" })
  @JoinColumn()
  game: Game;

  @ManyToOne(() => Genre, (genre) => genre.games, { onDelete: "CASCADE" })
  @JoinColumn()
  genre: Genre;
}
