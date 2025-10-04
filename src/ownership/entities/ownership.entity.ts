import { Game } from "src/game/entities/game.entity";
import { GameProgress } from "src/game/enums/game-progress.enum";
import { GameStatus } from "src/game/enums/game-status.enum";
import { User } from "src/user/entities/user.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class Ownership {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: GameStatus,
    default: GameStatus.BACKLOG,
  })
  status: GameStatus;

  @Column({
    type: "enum",
    enum: GameProgress,
    nullable: true,
  })
  progress?: GameProgress;

  @Column({ type: "timestamp", nullable: true })
  startedAt: Date;

  @Column({ type: "timestamp", nullable: true })
  endedAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.library, { onDelete: "CASCADE" })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Game, (game) => game.library, { onDelete: "CASCADE" })
  @JoinColumn()
  game: Game;
}
