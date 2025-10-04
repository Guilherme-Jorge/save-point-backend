import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateReviewDto } from "./dto/create-review.dto";
import { UpdateReviewDto } from "./dto/update-review.dto";
import { Review } from "./entities/review.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    return this.reviewRepository.save(createReviewDto);
  }

  async findAll(): Promise<Review[]> {
    const reviews = await this.reviewRepository.find();
    if (!reviews) {
      throw new NotFoundException("Reviews not found");
    }

    return reviews;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto) {
    return this.reviewRepository.update(id, updateReviewDto);
  }

  async remove(id: string) {
    await this.reviewRepository.delete(id);
  }
}
