import { Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Game } from 'src/game/entities/game.entity';
import { Wishlist } from './entities/wishlist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Game, Wishlist])],
  exports: [WishlistService],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
