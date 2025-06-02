import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Game } from './game.entity';
// import { ImageSizeMap } from 'src/shared/models/igdb-game';

@Entity()
export class Cover {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  igdbId: number;

  @Column()
  imageId: string;

  @Column()
  url: string;

  // @Column({ type: 'jsonb' })
  // urls: ImageSizeMap;

  @OneToOne(() => Game, (game) => game.cover)
  @JoinColumn()
  game: Game;
}
