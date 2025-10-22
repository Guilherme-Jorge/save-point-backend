import { Game } from "src/game/entities/game.entity";
import {
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Topic } from "./topic.entity";

@Entity()
export class Forum {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(() => Game, { onDelete: "CASCADE" })
  @JoinColumn()
  game: Game;

  @OneToMany(() => Topic, (topic) => topic.forum)
  topics: Topic[];
}
