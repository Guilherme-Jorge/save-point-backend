import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { WishlistDto } from './dto/wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from 'src/game/entities/game.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Wishlist } from './entities/wishlist.entity';
import { UserReturn } from 'src/user/dto/userReturn.dto';
import { GameReturn } from 'src/game/dto/game-return.dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wishlist)
    private wishlistRepository: Repository<Wishlist>
  ){}

  async addToWishlist(wishlistDto: WishlistDto) {
    const { gameId, userId } = wishlistDto;

    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new HttpException(
        { message: 'user Not found'},
        HttpStatus.NOT_FOUND,
      );
    }

    const game = await this.gameRepository.findOne({ where:{ id: gameId }})
    if (!game) {
      throw new HttpException(
        { message: 'game Not found'},
        HttpStatus.NOT_FOUND,
      );
    }

    const wishlistExists = await this.wishlistRepository.findOne({ where: { game: { id: gameId }, user: { id: userId } } });
    if (wishlistExists) {
      throw new HttpException(
        { message: 'Game already in wishlist.'},
        HttpStatus.FORBIDDEN,
      );
    }

    this.wishlistRepository.save({ user, game })
    return {
      user: new UserReturn(user),
      game: new GameReturn(game)
    }
  }

  async getAllByUserId(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } })

    if (!user) {
      throw new HttpException(
        { message: 'user Not found'},
        HttpStatus.NOT_FOUND,
      );
    }
    const games = await this.wishlistRepository.find({ where: { user: { id: userId } }, 
      relations: ['game',
        'game.genres',
        'game.genres.genre',
        'game.themes',
        'game.themes.theme',
        'game.gamemodes',
        'game.gamemodes.gamemode',
        'game.platforms',
        'game.platforms.platform',
        'game.artworks',
        'game.screenshots',
        'game.companies',
        'game.companies.company',
        'game.achievements',
        'game.cover'
      ]});

    const gameReturn: any = [];

    games.map((wishlistItem) => gameReturn.push({
      id: wishlistItem.id,
      createdAt: wishlistItem.createdAt,
      game: new GameReturn(wishlistItem.game)
    }));

    return gameReturn;
  }

  async remove(wishlistDto: WishlistDto) {
    const { gameId, userId } = wishlistDto;
    const wishlistItem = await this.wishlistRepository.findOne({ where: { game: { id: gameId }, user: { id: userId } } });

    if (!wishlistItem) {
      throw new HttpException(
        { message: 'wishlist item not found'},
        HttpStatus.NOT_FOUND,
      );
    }

    this.wishlistRepository.remove(wishlistItem);
  }
}
