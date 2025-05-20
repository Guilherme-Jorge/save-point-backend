import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SocialService } from './social.service';
import { SocialDto } from './dto/social.dto';


@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('follow')
  follow(@Body() socialDto: SocialDto) {
    return this.socialService.follow(socialDto);
  }
  // deixar de seguir um usuario
  @Post('unfollow')
  unfollow() {

  }
  // count de seguidores
  @Get()
  followers() {

  }
  // count de seguindo
  @Get()
  following() {

  }
  // is following?
  @Get('isfollowing')
  isFollowing() {
    
  }
  // retornar lista de seguidores
  // retornar lista de seguindo
}

