import { Game } from "src/game/entities/game.entity";
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
export class Review {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "boolean" })
  rating: boolean;

  @Column({ type: "text", nullable: true })
  reviewText?: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: "CASCADE" })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Game, (game) => game.reviews, { onDelete: "CASCADE" })
  game: Game;
}
