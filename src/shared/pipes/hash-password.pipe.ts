import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";

@Injectable()
export class HashPasswordPipe implements PipeTransform {
  constructor() {}

  async transform(password: string) {
    const saltRounds = 7;

    return await bcrypt.hash(password, saltRounds).then(function (hash) {
      return hash;
    });
  }
}
