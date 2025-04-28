import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  isUUID,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsUserConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async validate(value: string): Promise<boolean> {
    if (value === null || value === undefined) return false;

    if (!isUUID(value)) {
      throw new BadRequestException(`Invalid UUID: ${value}`);
    }

    const count = await this.userRepository.count({ where: { id: value } });
    return count > 0;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return `User with id ${validationArguments?.value} does not exist`;
  }
}

export function IsUser(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUserConstraint,
      async: true,
    });
  };
}
