// import { Game } from 'src/game/entity/game.entity';
import { Achievement } from 'src/achievement/entities/achievement.entity';
import { UserAchievement } from 'src/achievement/entities/user-achievement';
import { Ownership } from 'src/game/entities/ownership.entity';
import { Wishlist } from 'src/game/entities/wishlist.entity';
import { DirectMessage } from 'src/social/entities/direct-messages.entity';
import { Follows } from 'src/social/entities/follows.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  forgotPassToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  forgotPassExpires?: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @OneToMany(() => Ownership, (ownership) => ownership.user)
  library: Ownership[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.user)
  wishlisted: Wishlist[];

  @OneToMany(() => UserAchievement, (userAchievement) => userAchievement.user)
  achieved: Achievement[];

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
