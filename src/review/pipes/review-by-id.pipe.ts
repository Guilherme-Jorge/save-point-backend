import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PipeTransform,
} from '@nestjs/common';
import { Review } from '../entities/review.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isUUID } from 'class-validator';

@Injectable()
export class ReviewByIdPipe implements PipeTransform<string, Promise<Review>> {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async transform(value: string): Promise<Review> {
    if (!isUUID(value)) {
      throw new BadRequestException(`Invalid UUID: ${value}`);
    }

    const review = await this.reviewRepository.findOne({
      where: { id: value },
    });
    if (!review) {
      throw new NotFoundException(`Review with id ${value} not found`);
    }

    return review;
  }
}
