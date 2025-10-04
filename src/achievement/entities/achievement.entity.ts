import { Game } from "src/game/entities/game.entity";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UserAchievement } from "./user-achievement.entity";

@Entity()
export class Achievement {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "float", nullable: true })
  rarity?: number;

  @ManyToOne(() => Game, (game) => game.achievements, { onDelete: "CASCADE" })
  @JoinColumn()
  game: Game;

  @OneToMany(
    () => UserAchievement,
    (userAchievement) => userAchievement.achievement,
  )
  users: UserAchievement[];
}
