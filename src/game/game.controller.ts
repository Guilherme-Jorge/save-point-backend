import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseDatePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { GameService } from "./game.service";
import { CreateGameDto } from "./dto/create-game.dto";
import { UpdateGameDto } from "./dto/update-game.dto";
import { GameByIdPipe } from "./pipes/game-by-id.pipe";
import { Game } from "./entities/game.entity";
import { GameFromIgdbPipe } from "src/shared/pipes/game-from-igdb.pipe";
import { IgdbGame } from "src/shared/models/igdb-game";

@Controller("games")
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post("game")
  create(
    @Body() createGameDto: Omit<CreateGameDto, "releaseDate">,
    @Body("releaseDate", new ParseDatePipe()) releaseDate?: Date,
  ) {
    const dto = { ...createGameDto, releaseDate };

    return this.gameService.create(dto);
  }

  @Post("igdb/:id")
  createFromIgdb(@Param("id", GameFromIgdbPipe) igdbGame: IgdbGame) {
    return this.gameService.createFromIgdb(igdbGame);
  }

  @Get()
  findAll() {
    return this.gameService.findAll();
  }

  @Get("game/:id")
  findOne(@Param("id", GameByIdPipe) game: Game) {
    return game;
  }

  @Get("search")
  search(@Query("q") q: string) {
    return this.gameService.fuzzySearchByName(q);
  }

  @Get("keyword")
  searchByKeyword(@Query("q") keyword: string) {
    return this.gameService.findByKeyword(keyword);
  }

  @Patch("game/:id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateGameDto: Omit<UpdateGameDto, "releaseDate">,
    @Body("releaseDate", new ParseDatePipe()) releaseDate?: Date,
  ) {
    const dto = { ...updateGameDto, releaseDate };

    return this.gameService.update(id, dto);
  }

  @Delete("game/:id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.gameService.remove(id);
  }
}
