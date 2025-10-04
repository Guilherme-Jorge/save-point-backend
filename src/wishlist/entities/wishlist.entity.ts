import { Game } from "src/game/entities/game.entity";
import { User } from "src/user/entities/user.entity";
import {
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class Wishlist {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.wishlisted, { onDelete: "CASCADE" })
  @JoinTable()
  user: User;

  @ManyToOne(() => Game, (game) => game.wishlisted, { onDelete: "CASCADE" })
  @JoinTable()
  game: Game;
}
