import { PartialType } from '@nestjs/mapped-types';
import { CreateOwnershipDto } from './create-ownership.dto';

export class UpdateOwnershipDto extends PartialType(CreateOwnershipDto) {}
