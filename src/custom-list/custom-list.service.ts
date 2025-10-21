import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "src/user/entities/user.entity";
import { Game } from "src/game/entities/game.entity";
import { CustomList } from "./entities/custom-list.entity";
import { CustomListItem } from "./entities/custom-list-item.entity";
import { CreateCustomListDto } from "./dto/create-custom-list.dto";
import { AddToCustomListDto } from "./dto/add-to-custom-list.dto";
import { GameReturn } from "src/game/dto/game-return.dto";

@Injectable()
export class CustomListService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(CustomList)
    private readonly customListRepository: Repository<CustomList>,
    @InjectRepository(CustomListItem)
    private readonly customListItemRepository: Repository<CustomListItem>,
  ) {}

  async createList(dto: CreateCustomListDto) {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new HttpException(
        { message: "user Not found" },
        HttpStatus.NOT_FOUND,
      );
    }
    const list = this.customListRepository.create({ name: dto.name, user });
    await this.customListRepository.save(list);
    return { id: list.id, name: list.name, createdAt: list.createdAt };
  }

  async getListsByUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new HttpException(
        { message: "user Not found" },
        HttpStatus.NOT_FOUND,
      );
    }
    const lists = await this.customListRepository.find({
      where: { user: { id: userId } },
      relations: [
        "items",
        "items.game",
        "items.game.genres",
        "items.game.genres.genre",
        "items.game.themes",
        "items.game.themes.theme",
        "items.game.gamemodes",
        "items.game.gamemodes.gamemode",
        "items.game.platforms",
        "items.game.platforms.platform",
        "items.game.artworks",
        "items.game.screenshots",
        "items.game.companies",
        "items.game.companies.company",
        "items.game.achievements",
        "items.game.cover",
      ],
    });
    return lists.map((l) => ({
      id: l.id,
      name: l.name,
      createdAt: l.createdAt,
      games: l.items.map((i) => new GameReturn(i.game)),
    }));
  }

  async addToList(dto: AddToCustomListDto) {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });
    if (!user)
      throw new HttpException(
        { message: "user Not found" },
        HttpStatus.NOT_FOUND,
      );

    const list = await this.customListRepository.findOne({
      where: { id: dto.listId, user: { id: dto.userId } },
    });
    if (!list)
      throw new HttpException(
        { message: "list Not found" },
        HttpStatus.NOT_FOUND,
      );

    const game = await this.gameRepository.findOne({
      where: { id: dto.gameId },
    });
    if (!game)
      throw new HttpException(
        { message: "game Not found" },
        HttpStatus.NOT_FOUND,
      );

    const exists = await this.customListItemRepository.findOne({
      where: { list: { id: dto.listId }, game: { id: dto.gameId } },
    });
    if (exists) {
      throw new HttpException(
        { message: "Game already in list." },
        HttpStatus.FORBIDDEN,
      );
    }

    const item = this.customListItemRepository.create({ user, list, game });
    await this.customListItemRepository.save(item);
    return { id: item.id, createdAt: item.createdAt };
  }

  async removeFromList(dto: AddToCustomListDto) {
    const item = await this.customListItemRepository.findOne({
      where: {
        list: { id: dto.listId },
        game: { id: dto.gameId },
        user: { id: dto.userId },
      },
    });
    if (!item) {
      throw new HttpException(
        { message: "list item not found" },
        HttpStatus.NOT_FOUND,
      );
    }
    await this.customListItemRepository.remove(item);
  }

  async getItemsByListId(userId: string, listId: string) {
    const list = await this.customListRepository.findOne({
      where: { id: listId, user: { id: userId } },
    });
    if (!list)
      throw new HttpException(
        { message: "list Not found" },
        HttpStatus.NOT_FOUND,
      );

    const items = await this.customListItemRepository.find({
      where: { list: { id: listId } },
      relations: [
        "game",
        "game.genres",
        "game.genres.genre",
        "game.themes",
        "game.themes.theme",
        "game.gamemodes",
        "game.gamemodes.gamemode",
        "game.platforms",
        "game.platforms.platform",
        "game.artworks",
        "game.screenshots",
        "game.companies",
        "game.companies.company",
        "game.achievements",
        "game.cover",
      ],
    });

    return items.map((i) => ({
      id: i.id,
      createdAt: i.createdAt,
      game: new GameReturn(i.game),
    }));
  }
}
