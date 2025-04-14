import { User } from 'src/user/entities/user.entity';
import {
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Game } from './game.entity';

@Entity()
export class Wishlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user, { onDelete: 'CASCADE' })
  @JoinTable()
  user: User;

  @ManyToOne(() => Game, (game) => game, { onDelete: 'CASCADE' })
  @JoinTable()
  game: Game;
}
