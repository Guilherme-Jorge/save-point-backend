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
export class OwnershipsByUserIdPipe
  implements PipeTransform<string, Promise<Ownership[]>>
{
  constructor(
    @InjectRepository(Ownership)
    private readonly ownershipRepository: Repository<Ownership>,
  ) {}

  async transform(value: string): Promise<Ownership[]> {
    if (!isUUID(value)) {
      throw new BadRequestException(`Invalid UUID: ${value}`);
    }

    const ownerships = await this.ownershipRepository.find({
      where: {
        user: {
          id: value,
        },
      },
      relations: {
        user: true,
      },
    });

    if (!ownerships) {
      throw new NotFoundException(
        `Ownerships for user with id ${value} not found`,
      );
    }

    return ownerships;
  }
}
