import { Achievement } from 'src/achievement/entities/achievement.entity';
import { Game } from '../entities/game.entity';
import {
  IsArray,
  IsOptional,
  IsString,
  IsDate,
  IsNumber,
} from 'class-validator';

/**
 * Dto class to return a specific game
 */
export class GameReturn {
  constructor(game: Game) {
    this.id = game.id;
    this.igdbId = game.igdbId;
    this.name = game.name;
    this.summary = game.summary;
    this.releaseDate = game.releaseDate;
    this.cover = game.cover ? game.cover.url : undefined;

    this.genres = game.genres
      ? game.genres.map((genre) => genre.genre.name)
      : undefined;
    this.themes = game.themes
      ? game.themes.map((theme) => theme.theme.name)
      : undefined;
    this.gamemodes = game.gamemodes
      ? game.gamemodes.map((gamemode) => gamemode.gamemode.name)
      : undefined;
    this.platforms = game.platforms
      ? game.platforms.map((platform) => platform.platform.name)
      : undefined;
    this.companies = game.companies
      ? game.companies.map((company) => company.company.name)
      : undefined;
    this.artworks = game.artworks
      ? game.artworks.map((artwork) => artwork.url)
      : undefined;
    this.screenshots = game.screenshots
      ? game.screenshots.map((screenshot) => screenshot.url)
      : undefined;
    this.achievements = game.achievements
      ? game.achievements.map((achievement) => achievement)
      : undefined;
  }

  @IsOptional()
  @IsString()
  id?: string;

  @IsNumber()
  igdbId: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsDate()
  releaseDate?: Date;

  @IsArray()
  genres?: string[] = [];

  @IsArray()
  themes?: string[] = [];

  @IsArray()
  gamemodes?: string[] = [];

  @IsArray()
  platforms?: string[] = [];

  @IsArray()
  companies?: string[] = [];

  @IsArray()
  artworks?: string[] = [];

  @IsArray()
  screenshots?: string[] = [];

  @IsArray()
  achievements?: Achievement[] = [];

  @IsString()
  cover?: string;
}
