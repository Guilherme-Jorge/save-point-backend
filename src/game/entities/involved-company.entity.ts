import {
  Column,
  Entity,
  JoinTable,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Game } from './game.entity';
import { Company } from './company.entity';

export enum CompanyRoles {
  DEVELOPER = 'developer',
  PUBLISHER = 'publisher',
}

@Entity()
export class InvolvedCompany {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  igdbId: number;

  @Column({
    type: 'enum',
    enum: CompanyRoles,
  })
  role: CompanyRoles;

  @ManyToOne(() => Game, (game) => game.companies, { onDelete: 'CASCADE' })
  @JoinTable()
  game: Game;

  @ManyToOne(() => Company, (company) => company.games, { onDelete: 'CASCADE' })
  @JoinTable()
  company: Company;
}
