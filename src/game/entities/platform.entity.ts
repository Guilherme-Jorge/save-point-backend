import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { GamePlatform } from './game-platform.entity';

@Entity()
export class Platform {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  igdbId: number;

  @Column()
  name: string;

  @OneToMany(() => GamePlatform, (gamePlatform) => gamePlatform.platform)
  games: GamePlatform[];
}
