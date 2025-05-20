import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { UserReturn } from 'src/user/dto/userReturn.dto';
import { GameReturn } from 'src/game/dto/game-return.dto';
import { Follows } from './entities/follows.entity';
import { SocialDto } from './dto/social.dto';

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Follows)
    private followsRepository: Repository<Follows>
  ){}

  async follow(socialDto: SocialDto) {
    const { userId, followerId } = socialDto;

    const follower = await this.userRepository.findOne({ where: { id: userId } })
    if (!follower) {
      throw new HttpException(
        { message: 'follower Not found'},
        HttpStatus.NOT_FOUND,
      );
    }

    const followed = await this.userRepository.findOne({ where: { id: followerId } })
    if (!followed) {
      throw new HttpException(
        { message: 'followed Not found'},
        HttpStatus.NOT_FOUND,
      );
    }

    const alreadyFollowing = await this.followsRepository.findOne({ where: { follower: { id:  userId }, followed: { id: followerId } } })
    if (alreadyFollowing) {
      throw new HttpException(
        { message: 'Already following this user.'},
        HttpStatus.FORBIDDEN,
      );
    }

    this.followsRepository.save({follower, followed})

    return {
        follower: new UserReturn(follower),
        followed: new UserReturn(followed)
    }
  }
  
}
