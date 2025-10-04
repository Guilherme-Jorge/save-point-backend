import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PipeTransform,
} from "@nestjs/common";
import { Ownership } from "../entities/ownership.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { isUUID } from "class-validator";

@Injectable()
export class OwnershipByIdPipe
  implements PipeTransform<string, Promise<Ownership>>
{
  constructor(
    @InjectRepository(Ownership)
    private readonly ownershipRepository: Repository<Ownership>,
  ) {}

  async transform(value: string): Promise<Ownership> {
    if (!isUUID(value)) {
      throw new BadRequestException(`Invalid UUID: ${value}`);
    }

    const ownership = await this.ownershipRepository.findOne({
      where: { id: value },
    });
    if (!ownership) {
      throw new NotFoundException(`Ownership with id ${value} not found`);
    }

    return ownership;
  }
}
