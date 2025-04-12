import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserRegister } from './dto/userRegister.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import * as bcrypt from 'bcryptjs';
import { UserReturn } from './dto/userReturn.dto';
import { UserSignIn } from './dto/userSignIn.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usuariosRepository: Repository<User>,
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
      console.log('Log do erro: ' + e);
      throw new HttpException(
        { message: 'Erro ao salvar dados no banco.' },
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

    const saltRounds = 7;
    await bcrypt.hash(user.password, saltRounds).then(function (hash) {
      user.password = hash;
    });

    await this.executePromises(async () => {
      userDB = await this.usuariosRepository.save(user);
    });

    return {
      user: new UserReturn(userDB),
      message: 'Usuário registrado com sucesso.',
    };
  }

  async signIn(user: UserSignIn) {
    const userDB = await this.findUserByEmail(user.email);

    await bcrypt
      .compare(user.password, userDB.password)
      .then(function (result) {
        if (!result)
          throw new HttpException(
            { message: 'Senha ou email incorretos.' },
            HttpStatus.FORBIDDEN,
          );
      });

    return {
      message: 'Login efetuado com sucesso.',
    };
  }

  /**
   * This function find a user by id
   * @param id user id
   * @returns the finded user
   */
  async findUserById(id: string) {
    const user = await this.usuariosRepository.findOne({ where: { id: id } });

    if (!user)
      throw new HttpException(
        { message: 'Usuário não encontrado.' },
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
    const user = await this.usuariosRepository.findOne({
      where: { email: email },
    });

    if (!user)
      throw new HttpException(
        { message: 'Usuário não encontrado.' },
        HttpStatus.NOT_FOUND,
      );

    return user;
  }
}
