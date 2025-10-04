import { IsEmail, IsOptional, IsString } from "class-validator";

export class emailDto {
  @IsEmail({}, { each: true })
  recipents: string[];

  @IsString()
  subject: string;

  @IsString()
  html: string;

  @IsOptional()
  @IsString()
  text?: string;
}
