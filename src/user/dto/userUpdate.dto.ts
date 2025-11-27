import { IsOptional, IsUrl, MaxLength } from "class-validator";

export class UserUpdate {
  @IsOptional()
  username: string;

  @IsOptional()
  email: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ["http", "https"] })
  @MaxLength(2048)
  profilePictureUrl?: string;
}
