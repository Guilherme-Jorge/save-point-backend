import {
  Column,
  Entity,
  JoinTable,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Game } from './game.entity';

@Entity()
export class Screenshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  igdbId: number;

  @Column()
  url: string;

  @ManyToOne(() => Game, (game) => game.screenshots, { onDelete: 'CASCADE' })
  @JoinTable()
  game: Game;
}
