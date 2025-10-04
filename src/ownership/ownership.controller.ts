import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseDatePipe,
  ParseUUIDPipe,
} from "@nestjs/common";
import { OwnershipService } from "./ownership.service";
import { User } from "src/user/entities/user.entity";
import { Game } from "src/game/entities/game.entity";
import { UserByIdPipe } from "src/user/pipes/user-by-id.pipe";
import { GameByIdPipe } from "src/game/pipes/game-by-id.pipe";
import { CreateOwnershipDto } from "./dto/create-ownership.dto";
import { UpdateOwnershipDto } from "./dto/update-ownership.dto";
import { OwnershipsByUserIdPipe } from "./pipes/ownerships-by-user-id.pipe";
import { Ownership } from "./entities/ownership.entity";
import { OwnershipByIdPipe } from "./pipes/ownership-by-id.pipe";
import { OwnershipsByGameIdPipe } from "./pipes/ownerships-by-game-id.pipe";

@Controller("ownerships")
export class OwnershipController {
  constructor(private readonly ownershipService: OwnershipService) {}

  @Post()
  create(
    @Body()
    createOwnershipDto: Omit<
      CreateOwnershipDto,
      "user" | "game" | "startedAt" | "endedAt"
    >,
    @Body("user", UserByIdPipe) user: User,
    @Body("game", GameByIdPipe) game: Game,
    @Body("startedAt", new ParseDatePipe({ optional: true })) startedAt?: Date,
    @Body("endedAt", new ParseDatePipe({ optional: true })) endedAt?: Date,
  ) {
    const dto = { ...createOwnershipDto, user, game, startedAt, endedAt };

    return this.ownershipService.create(dto);
  }

  @Get()
  findAll() {
    return this.ownershipService.findAll();
  }

  @Get("user/:id")
  findAllByUser(@Param("id", OwnershipsByUserIdPipe) ownerships: Ownership[]) {
    return ownerships;
  }

  @Get("game/:id")
  findAllByGame(@Param("id", OwnershipsByGameIdPipe) ownerships: Ownership[]) {
    return ownerships;
  }

  @Get("ownership/:id")
  findOne(@Param("id", OwnershipByIdPipe) ownership: Ownership) {
    return ownership;
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body()
    updateOwnershipDto: Omit<UpdateOwnershipDto, "startedAt" | "endedAt">,
    @Body("startedAt", new ParseDatePipe({ optional: true })) startedAt?: Date,
    @Body("endedAt", new ParseDatePipe({ optional: true })) endedAt?: Date,
  ) {
    const dto = { ...updateOwnershipDto, startedAt, endedAt };

    return this.ownershipService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.ownershipService.remove(id);
  }
}
