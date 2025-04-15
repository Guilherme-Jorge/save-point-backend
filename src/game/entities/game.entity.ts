import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Ownership } from './ownership.entity';
import { Wishlist } from './wishlist.entity';
import { GameGenre } from './game-genre.entity';
import { GameTheme } from './game-theme.entity';
import { GameGamemode } from './game-gamemode.entity';
import { GamePlatform } from './game-platform.entity';
import { InvolvedCompany } from './involved-company.entity';
import { Artwork } from './artwork.entity';
import { Screenshot } from './screenshot.entity';
import { Achievement } from 'src/achievement/entities/achievement.entity';

@Entity()
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  igdbId: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @Column({ type: 'date', nullable: true })
  releaseDate?: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @OneToMany(() => Ownership, (ownership) => ownership.game)
  library: Ownership[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.game)
  wishlisted: Wishlist[];

  @OneToMany(() => GameGenre, (gameGenre) => gameGenre.game)
  genres: GameGenre[];

  @OneToMany(() => GameTheme, (gameTheme) => gameTheme.game)
  themes: GameTheme[];

  @OneToMany(() => GameGamemode, (gameGamemode) => gameGamemode.game)
  gamemodes: GameGamemode[];

  @OneToMany(() => GamePlatform, (gamePlatform) => gamePlatform.game)
  platforms: GamePlatform[];

  @OneToMany(() => InvolvedCompany, (involvedCompany) => involvedCompany.game)
  companies: InvolvedCompany[];

  @OneToMany(() => Artwork, (artwork) => artwork.game)
  artworks: Artwork[];

  @OneToMany(() => Screenshot, (screenshot) => screenshot.game)
  screenshots: Screenshot[];

  @OneToMany(() => Achievement, (achievement) => achievement.game)
  achievements: Achievement[];
}
