import { IsString } from "class-validator";

export class WishlistDto {

    @IsString()
    gameId: string

    @IsString()
    userId: string
}
