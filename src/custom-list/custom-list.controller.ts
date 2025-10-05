import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { CustomListService } from "./custom-list.service";
import { CreateCustomListDto } from "./dto/create-custom-list.dto";
import { AddToCustomListDto } from "./dto/add-to-custom-list.dto";

@Controller("custom-lists")
export class CustomListController {
  constructor(private readonly customListService: CustomListService) {}

  @Post()
  create(@Body() dto: CreateCustomListDto) {
    return this.customListService.createList(dto);
  }

  @Get("user/:userId")
  getLists(@Param("userId") userId: string) {
    return this.customListService.getListsByUser(userId);
  }

  @Get("user/:userId/:listId/items")
  getItems(@Param("userId") userId: string, @Param("listId") listId: string) {
    return this.customListService.getItemsByListId(userId, listId);
  }

  @Post("items")
  addItem(@Body() dto: AddToCustomListDto) {
    return this.customListService.addToList(dto);
  }

  @Delete("items")
  removeItem(@Body() dto: AddToCustomListDto) {
    return this.customListService.removeFromList(dto);
  }
}
