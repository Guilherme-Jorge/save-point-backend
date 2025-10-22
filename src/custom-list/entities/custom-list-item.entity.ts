import { Game } from "src/game/entities/game.entity";
import { User } from "src/user/entities/user.entity";
import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { CustomList } from "./custom-list.entity";

@Entity()
@Unique(["list", "game"])
export class CustomListItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user: User;

  @ManyToOne(() => CustomList, (list) => list.items, { onDelete: "CASCADE" })
  list: CustomList;

  @ManyToOne(() => Game, { onDelete: "CASCADE" })
  game: Game;
}
