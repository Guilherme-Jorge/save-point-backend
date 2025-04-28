import { Module } from '@nestjs/common';
import { OwnershipService } from './ownership.service';
import { OwnershipController } from './ownership.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ownership } from './entities/ownership.entity';
import { User } from 'src/user/entities/user.entity';
import { Game } from 'src/game/entities/game.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Game, Ownership])],
  exports: [OwnershipService],
  controllers: [OwnershipController],
  providers: [OwnershipService],
})
export class OwnershipModule {}
