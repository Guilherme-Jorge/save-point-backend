import { User } from "src/user/entities/user.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { CustomListItem } from "./custom-list-item.entity";

@Entity()
export class CustomList {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => User, (user) => user.customLists, { onDelete: "CASCADE" })
  user: User;

  @OneToMany(() => CustomListItem, (item) => item.list)
  items: CustomListItem[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;
}
