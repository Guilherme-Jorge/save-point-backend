import { InjectRepository } from '@nestjs/typeorm';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
@ValidatorConstraint({ async: true })
export class EmailValidator implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async validate(email: string): Promise<boolean> {
    let userExist;
    await this.userRepository
      .findOne({ where: { email: email } })
      .then((user) => {
        userExist = user;
      });

    return userExist == null;
  }
}

export const UniqueEmail = (ValidationOptions: ValidationOptions) => {
  return (obj: object, property: string) => {
    registerDecorator({
      target: obj.constructor,
      propertyName: property,
      options: ValidationOptions,
      constraints: [],
      validator: EmailValidator,
    });
  };
};
