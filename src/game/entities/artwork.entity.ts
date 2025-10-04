import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Game } from "./game.entity";
// import { ImageSizeMap } from 'src/shared/models/igdb-game';

@Entity()
export class Artwork {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  igdbId: number;

  @Column()
  imageId: string;

  @Column()
  url: string;

  // @Column({ type: 'jsonb' })
  // urls: ImageSizeMap;

  @ManyToOne(() => Game, (game) => game.artworks, { onDelete: "CASCADE" })
  @JoinColumn()
  game: Game;
}
