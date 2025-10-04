import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "src/user/entities/user.entity";
import { UserReturn } from "src/user/dto/userReturn.dto";
import { GameReturn } from "src/game/dto/game-return.dto";
import { Follows } from "./entities/follows.entity";
import { SocialDto } from "./dto/social.dto";

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Follows)
    private followsRepository: Repository<Follows>,
  ) {}

  async follow(socialDto: SocialDto) {
    const { userId, followerId } = socialDto;

    const follower = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!follower) {
      throw new HttpException(
        { message: "follower Not found" },
        HttpStatus.NOT_FOUND,
      );
    }

    const followed = await this.userRepository.findOne({
      where: { id: followerId },
    });
    if (!followed) {
      throw new HttpException(
        { message: "followed Not found" },
        HttpStatus.NOT_FOUND,
      );
    }

    const alreadyFollowing = await this.followsRepository.findOne({
      where: { follower: { id: userId }, followed: { id: followerId } },
    });
    if (alreadyFollowing) {
      throw new HttpException(
        { message: "Already following this user." },
        HttpStatus.FORBIDDEN,
      );
    }

    this.followsRepository.save({ follower, followed });

    return {
      followed: new UserReturn(followed),
      message: `${followed.username} followed successfully.`,
    };
  }

  async unfollow(socialDto: SocialDto) {
    const { userId, followerId } = socialDto;

    const alreadyFollowing = await this.followsRepository.findOne({
      where: { follower: { id: userId }, followed: { id: followerId } },
    });
    if (!alreadyFollowing) {
      throw new HttpException(
        { message: "You dont follow this user. Refresh your page." },
        HttpStatus.NOT_FOUND,
      );
    }

    this.followsRepository.remove(alreadyFollowing);

    return {
      message: `unfollowed successfully.`,
    };
  }

  async getFriendsList(userId: string) {
    const userDB = await this.userRepository.findOne({ where: { id: userId } });
    if (!userDB) {
      throw new HttpException(
        { message: "follower Not found" },
        HttpStatus.NOT_FOUND,
      );
    }

    /** FollowsItem represent a List of {@link follows.entity.ts} */
    const followsItem = await this.followsRepository.find({
      where: { follower: { id: userId } },
      relations: ["followed"],
    });

    const friendsList: any = [];

    followsItem.map((friend) =>
      friendsList.push(new UserReturn(friend.followed)),
    );

    return friendsList;
  }

  async isFollowing(socialDto: SocialDto) {
    const { userId, followerId } = socialDto;

    const follower = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!follower) {
      throw new HttpException(
        { message: "follower Not found" },
        HttpStatus.NOT_FOUND,
      );
    }

    const followed = await this.userRepository.findOne({
      where: { id: followerId },
    });
    if (!followed) {
      throw new HttpException(
        { message: "followed Not found" },
        HttpStatus.NOT_FOUND,
      );
    }
    const alreadyFollowing = await this.followsRepository.findOne({
      where: { follower: { id: userId }, followed: { id: followerId } },
    });

    return alreadyFollowing ? true : false;
  }
}
