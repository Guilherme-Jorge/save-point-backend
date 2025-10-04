import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { SocialService } from "./social.service";
import { SocialDto } from "./dto/social.dto";

@Controller("social")
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post("follow")
  follow(@Body() socialDto: SocialDto) {
    return this.socialService.follow(socialDto);
  }

  @Post("unfollow")
  unfollow(@Body() socialDto: SocialDto) {
    return this.socialService.unfollow(socialDto);
  }

  @Post("following")
  isFollowing(@Body() socialDto: SocialDto) {
    return this.socialService.isFollowing(socialDto);
  }

  @Post("friends/:id")
  getFriends(@Param("id") userId: string) {
    return this.socialService.getFriendsList(userId);
  }
}
