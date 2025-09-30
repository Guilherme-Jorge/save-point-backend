import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "src/user/entities/user.entity";
import { Message } from "./message.entity";

@Entity()
export class Chat {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  lastMessage: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn()
  user1: User;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn()
  user2: User;

  @OneToMany(() => Message, (message) => message.chat)
  messages: Message[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;
}
