import { PartialType } from "@nestjs/mapped-types";
import { WishlistDto } from "./wishlist.dto";

export class UpdateWishlistDto extends PartialType(WishlistDto) {}
