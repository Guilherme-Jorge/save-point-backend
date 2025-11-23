import { UserAchievement } from "src/achievement/entities/user-achievement.entity";
import { Ownership } from "src/ownership/entities/ownership.entity";
import { Wishlist } from "src/wishlist/entities/wishlist.entity";
import { DirectMessage } from "src/direct-message/entities/direct-message.entity";
import { Follows } from "src/social/entities/follows.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";
import { Review } from "src/review/entities/review.entity";
import { CustomList } from "src/custom-list/entities/custom-list.entity";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  forgotPassToken?: string;

  @Column({ type: "timestamp", nullable: true })
  forgotPassExpires?: Date;

  @DeleteDateColumn({ type: "timestamp", nullable: true })
  deletedAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @OneToMany(() => Ownership, (ownership) => ownership.user)
  library: Ownership[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.user)
  wishlisted: Wishlist[];

  @OneToMany(() => CustomList, (list) => list.user)
  customLists: CustomList[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @OneToMany(() => UserAchievement, (userAchievement) => userAchievement.user)
  achieved: UserAchievement[];

  // The Follows rows where this user is the follower.
  @OneToMany(() => Follows, (follows) => follows.followed)
  followers: Follows[];

  // The Follows rows where this user is followed.
  @OneToMany(() => Follows, (follows) => follows.follower)
  following: Follows[];

  @OneToMany(() => DirectMessage, (directMessage) => directMessage.sender)
  sentMessage: DirectMessage[];

  @OneToMany(() => DirectMessage, (directMessage) => directMessage.receiver)
  receivedMessage: DirectMessage[];
}
