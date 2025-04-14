import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { GameGamemode } from './game-gamemode.entity';

@Entity()
export class Gamemode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  igdbId: number;

  @Column()
  name: string;

  @OneToMany(() => GameGamemode, (gameGamemode) => gameGamemode.gamemode)
  games: GameGamemode[];
}
