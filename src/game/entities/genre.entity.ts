import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { GameGenre } from './game-genre.entity';

@Entity()
export class Genre {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  igdbId: number;

  @Column()
  name: string;

  @OneToMany(() => GameGenre, (gameGenre) => gameGenre.genre)
  games: GameGenre[];
}
