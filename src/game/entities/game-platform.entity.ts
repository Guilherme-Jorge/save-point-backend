import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Game } from './game.entity';
import { Platform } from './platform.entity';

@Entity()
export class GamePlatform {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Game, (game) => game.platforms, { onDelete: 'CASCADE' })
  @JoinColumn()
  game: Game;

  @ManyToOne(() => Platform, (platform) => platform.games, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  platform: Platform;
}
