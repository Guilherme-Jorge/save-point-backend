import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { InvolvedCompany } from './involved-company.entity';

@Entity()
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @OneToMany(
    () => InvolvedCompany,
    (involvedCompany) => involvedCompany.company,
  )
  games: InvolvedCompany[];
}
