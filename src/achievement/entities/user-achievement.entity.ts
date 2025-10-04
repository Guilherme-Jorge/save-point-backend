import { User } from "src/user/entities/user.entity";
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Achievement } from "./achievement.entity";

@Entity()
export class UserAchievement {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.achieved, { onDelete: "CASCADE" })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Achievement, (achievement) => achievement.users, {
    onDelete: "CASCADE",
  })
  @JoinColumn()
  achievement: Achievement;
}
