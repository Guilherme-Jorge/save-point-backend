import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserRegister } from './dto/userRegister.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { UserReturn } from './dto/userReturn.dto';
import { UserSignIn } from './dto/userSignIn.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * This function cover all DB Requests with try/catch validation.
   * @param action Promise to be maked.
   * @returns the promisse callback.
   */
  async executePromises<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (e) {
      console.log('Error log: ' + e);
      throw new HttpException(
        { message: 'Error when saving to database.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * This function register a new user.
   * @param user User to be saved.
   * @returns promisse callback.
   */
  async registerUser(user: UserRegister) {
    let userDB = {
      id: '',
      email: '',
      username: '',
    };
        
    await this.executePromises(async () => {
      userDB = await this.userRepository.save(user);
    });

    return {
      user: new UserReturn(userDB),
      message: 'User registered successfully.',
    };
  }

  async signIn(user: UserSignIn) {
    const userDB = await this.findUserByEmail(user.email);

    await bcrypt
      .compare(user.password, userDB.password)
      .then(function (result) {
        if (!result)
          throw new HttpException(
            { message: 'Email or password are incorrect.' },
            HttpStatus.FORBIDDEN,
          );
      });

    return {
      message: 'Login successful.',
    };
  }

  /**
   * This function find a user by id
   * @param id user id
   * @returns the finded user
   */
  async findUserById(id: string) {
    const user = await this.userRepository.findOne({ where: { id: id } });

    if (!user)
      throw new HttpException(
        { message: 'User not found.' },
        HttpStatus.NOT_FOUND,
      );

    return user;
  }

  /**
   * This function find a user by email
   * @param email user email
   * @returns the finded user
   */
  async findUserByEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email: email },
    });

    if (!user)
      throw new HttpException(
        { message: 'User not found.' },
        HttpStatus.NOT_FOUND,
      );

    return user;
  }
}
