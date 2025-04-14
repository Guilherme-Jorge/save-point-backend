import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Game } from './game.entity';

export enum GameStatus {
  BACKLOG = 'backlog',
  PLAYING = 'playing',
  PLAYED = 'played',
}

export enum GameProgress {
  STARTED = 'started',
  DROPPED = 'dropped',
  FINISHED = 'finished',
  COMPLETED = 'completed',
}

@Entity()
export class Ownership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  gameId: string;

  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.BACKLOG,
  })
  status: GameStatus;

  @Column({
    type: 'enum',
    enum: GameProgress,
    nullable: true,
  })
  progress?: GameProgress;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.library, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Game, (game) => game, { onDelete: 'CASCADE' })
  @JoinColumn()
  game: Game;
}
