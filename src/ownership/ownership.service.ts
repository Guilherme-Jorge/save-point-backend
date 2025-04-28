import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOwnershipDto } from './dto/create-ownership.dto';
import { UpdateOwnershipDto } from './dto/update-ownership.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Ownership } from './entities/ownership.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OwnershipService {
  constructor(
    @InjectRepository(Ownership)
    private ownershipRepository: Repository<Ownership>,

    private readonly configService: ConfigService,
  ) {}

  async create(createOwnershipDto: CreateOwnershipDto): Promise<Ownership> {
    return this.ownershipRepository.save(createOwnershipDto);
  }

  async findAll(): Promise<Ownership[]> {
    const ownerships = await this.ownershipRepository.find();
    if (!ownerships) {
      throw new NotFoundException('Ownerships not found');
    }

    return ownerships;
  }

  async update(id: string, updateOwnershipDto: UpdateOwnershipDto) {
    return this.ownershipRepository.update(id, updateOwnershipDto);
  }

  async remove(id: string) {
    await this.ownershipRepository.delete(id);
  }
}
