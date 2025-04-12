// import { Game } from 'src/game/entity/game.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  forgotPassToken: string;

  @Column({ nullable: true })
  forgotPassExpires: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  // @ManyToMany(() => Game)
  // @JoinTable()
  // ownership: Game[];

  @ManyToMany(() => User)
  @JoinTable()
  follows: User[];
}
