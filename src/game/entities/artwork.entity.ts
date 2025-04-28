import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Game } from './game.entity';

@Entity()
export class Artwork {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  igdbId: number;

  @Column()
  url: string;

  @ManyToOne(() => Game, (game) => game.artworks, { onDelete: 'CASCADE' })
  @JoinColumn()
  game: Game;
}
