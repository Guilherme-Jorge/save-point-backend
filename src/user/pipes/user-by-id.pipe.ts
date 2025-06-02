import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PipeTransform,
} from '@nestjs/common';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isUUID } from 'class-validator';

@Injectable()
export class UserByIdPipe implements PipeTransform<string, Promise<User>> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async transform(value: string): Promise<User> {
    if (!isUUID(value)) {
      throw new BadRequestException(`Invalid UUID: ${value}`);
    }

    const user = await this.userRepository.findOne({ where: { id: value } });
    if (!user) {
      throw new NotFoundException(`User with id ${value} not found`);
    }

    return user;
  }
}
