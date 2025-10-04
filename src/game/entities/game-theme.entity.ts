import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Game } from "./game.entity";
import { Theme } from "./theme.entity";

@Entity()
export class GameTheme {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Game, (game) => game.themes, { onDelete: "CASCADE" })
  @JoinColumn()
  game: Game;

  @ManyToOne(() => Theme, (theme) => theme.games, { onDelete: "CASCADE" })
  @JoinColumn()
  theme: Theme;
}
