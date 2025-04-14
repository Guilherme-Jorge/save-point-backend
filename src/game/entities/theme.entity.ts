import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { GameTheme } from './game-theme.entity';

@Entity()
export class Theme {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  igdbId: number;

  @Column()
  name: string;

  @OneToMany(() => GameTheme, (gameTheme) => gameTheme.theme)
  games: GameTheme[];
}
