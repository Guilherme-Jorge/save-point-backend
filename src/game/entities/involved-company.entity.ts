import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Game } from "./game.entity";
import { Company } from "./company.entity";
import { CompanyRoles } from "../enums/company-roles.enum";

@Entity()
export class InvolvedCompany {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: CompanyRoles,
  })
  role: CompanyRoles;

  @ManyToOne(() => Game, (game) => game.companies, { onDelete: "CASCADE" })
  @JoinColumn()
  game: Game;

  @ManyToOne(() => Company, (company) => company.games, { onDelete: "CASCADE" })
  @JoinColumn()
  company: Company;
}
