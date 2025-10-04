import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { WishlistService } from "./wishlist.service";
import { WishlistDto } from "./dto/wishlist.dto";
import { UpdateWishlistDto } from "./dto/update-wishlist.dto";

@Controller("wishlist")
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  addToWishlist(@Body() wishlistDto: WishlistDto) {
    return this.wishlistService.addToWishlist(wishlistDto);
  }

  @Get(":userId")
  getAll(@Param("userId") userId: string) {
    return this.wishlistService.getAllByUserId(userId);
  }

  @Delete()
  remove(@Body() wishlistDto: WishlistDto) {
    return this.wishlistService.remove(wishlistDto);
  }
}
