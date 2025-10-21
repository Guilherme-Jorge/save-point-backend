import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PipeTransform,
} from "@nestjs/common";
import { Review } from "../entities/review.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { isUUID } from "class-validator";

@Injectable()
export class ReviewByGameIdPipe
  implements PipeTransform<string, Promise<Review[]>>
{
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async transform(value: string): Promise<Review[]> {
    if (!isUUID(value)) {
      throw new BadRequestException(`Invalid UUID: ${value}`);
    }

    const reviews = await this.reviewRepository.find({
      where: {
        game: {
          id: value,
        },
      },
      relations: {
        game: true,
        user: true,
      },
    });

    if (!reviews) {
      throw new NotFoundException(`Reviews with id ${value} not found`);
    }

    return reviews;
  }
}
