import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserRegister } from './dto/userRegister.dto';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { user } from './entity/user.entity';
import * as bcrypt from 'bcryptjs';
import { UserReturn } from './dto/userReturn.dto';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(user)
        private usuariosRepository: Repository<user>,
        private jwtService: JwtService
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
            id: 0,
            email: '',
            name: ''
        };

        const saltRounds = 7
        await bcrypt.hash(user.password, saltRounds).then(function(hash) {
            user.password = hash
        });

        await this.executePromises(async () => {
            userDB = await this.usuariosRepository.save(user);
        });

        return {
            user: new UserReturn(userDB),
            message: 'Usuário registrado com sucesso.',
        };
    }
}
