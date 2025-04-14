import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Game } from './game.entity';
import { Gamemode } from './gamemode.entity';

@Entity()
export class GameGamemode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Game, (game) => game.gamemodes, { onDelete: 'CASCADE' })
  @JoinColumn()
  game: Game;

  @ManyToOne(() => Gamemode, (gamemode) => gamemode.games, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  gamemode: Gamemode;
}
