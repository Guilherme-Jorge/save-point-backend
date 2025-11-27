import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { UserRegister } from "./dto/userRegister.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { User } from "./entities/user.entity";
import * as bcrypt from "bcryptjs";
import { UserReturn } from "./dto/userReturn.dto";
import { UserSignIn } from "./dto/userSignIn.dto";
import { UserUpdate } from "./dto/userUpdate.dto";
import { v4 as uuid } from "uuid";
import { EmailService } from "src/email/email.service";
import { CustomList } from "src/custom-list/entities/custom-list.entity";
import { CreateCustomListDto } from "src/custom-list/dto/create-custom-list.dto";
import { Response } from "express";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(CustomList)
    private customListRepository: Repository<CustomList>,
    private readonly emailService: EmailService,
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
      console.log("Error log: " + e);
      throw new HttpException(
        { message: "Error when saving to database." },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * This function register a new user.
   * @param user User to be saved.
   * @returns promisse callback.
   */
  async registerUser(user: UserRegister, acceptLanguage: string) {
    const portuguese = acceptLanguage.startsWith("pt") ? true : false;

    let userDB = {
      id: "",
      email: "",
      username: "",
    };

    await this.executePromises(async () => {
      userDB = await this.userRepository.save(user);
    });

    const wishlist: CreateCustomListDto = {
      userId: userDB.id,
      name: portuguese ? "Lista de Desejos" : "Wishlist",
    };

    await this.executePromises(async () => {
      await this.customListRepository.save(wishlist);
    });

    return {
      user: new UserReturn(userDB),
      message: "User registered successfully.",
    };
  }

  /**
   * This function signin a user.
   * @param user to signin.
   * @returns promise callback.
   */
  async signIn(user: UserSignIn) {
    const userDB = await this.findUserByEmail(user.email);

    if (userDB.deletedAt != null) {
      throw new HttpException(
        { message: "This user was deleted. Contact the support." },
        HttpStatus.FORBIDDEN,
      );
    }

    await bcrypt
      .compare(user.password, userDB.password)
      .then(function (result) {
        if (!result)
          throw new HttpException(
            { message: "Email or password are incorrect." },
            HttpStatus.FORBIDDEN,
          );
      });

    return {
      user: new UserReturn(userDB),
      message: "Login successful.",
    };
  }

  /**
   * this function update an existent user.
   * @param id existent user id
   * @param user existent user data
   * @returns promise callback.
   */
  async updateUser(id: string, user: Partial<UserUpdate>) {
    const userToUpdate = await this.findUserById(id);
    userToUpdate.updatedAt = new Date();

    Object.entries(user).map(async ([key, value]) => {
      userToUpdate[key] = value;
    });

    await this.executePromises(async () => {
      await this.userRepository.save(userToUpdate);
    });

    return {
      user: new UserReturn(userToUpdate),
      message: "User updated successfully.",
    };
  }

  /**
   * This function delete an existent user.
   * @param id user id.
   * @param pass user password.
   * @returns promise callback.
   */
  // user.service.ts (Função deleteUser corrigida)

  /**
   * This function deletes/deactivates an existent user (Soft Delete).
   * @param id user id.
   * @param pass user password.
   * @returns promise callback.
   */
  /**
   * This function deletes/deactivates an existent user (Soft Delete).
   * @param id user id.
   * @param pass user password.
   * @returns promise callback.
   */
  async deleteUser(id: string, pass: string) {
    const userToDelete = await this.findUserById(id);
    const samePassword = await bcrypt.compare(pass, userToDelete.password);

    if (!samePassword) {
      throw new HttpException(
        { message: "Senha incorreta." },
        HttpStatus.FORBIDDEN,
      );
    }

    await this.executePromises(async () => {
      await this.userRepository.softDelete(id);
    });

    return {
      message: "Conta desativada com sucesso.",
      userId: id,
    };
  }

  /**
   * FirstStep to recover the user password. Send a email with a Dinamic Url to reset the password.
   * @param email user email.
   */
  async forgotPass(email: string) {
    const userDB = await this.findUserByEmail(email);

    const token = uuid();
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);

    userDB.forgotPassToken = token;
    userDB.forgotPassExpires = expirationDate;

    await this.executePromises(async () => {
      await this.userRepository.save(userDB);
    });

    // link to reset the password
    const link = `http://localhost:5173/Forgotpsw2/?token=${token}`;

    const emailOptions = {
      recipents: [email],
      subject: "SavePoint - Recuperar Senha",
      html: `<p>Se deseja recuperar a sua senha, acesse este link: <a href="${link}">${link}</a></p><br><i>Atenção, você terá apenas 1 hora para alterar sua senha.</i><br><p>Se não foi você, desconsidere a mensagem.</p>`,
    };

    this.emailService.sendEmail(emailOptions);
  }

  async recoverPass(token: string, newPass: string) {
    const userDB = await this.findUserByTokenAndExpireDate(token);

    const saltRounds = 7;
    await bcrypt.hash(newPass, saltRounds).then(function (hash) {
      // update new password
      userDB.password = hash;
      // reset passToken after recovered the password
      userDB.forgotPassToken = "";
    });

    await this.executePromises(async () => {
      await this.userRepository.save(userDB);
    });
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
        { message: "User not found." },
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
        { message: "User not found." },
        HttpStatus.NOT_FOUND,
      );

    return user;
  }

  async findAll() {
    // Não retorna usuários com soft delete (deletedAt != null)
    const users = await this.userRepository.find({
      where: { deletedAt: IsNull() },
    });

    if (!users || users.length === 0)
      throw new HttpException(
        { message: "Users not found." },
        HttpStatus.NOT_FOUND,
      );

    return users;
  }

  /**
   * This function find a user by email
   * @param email user email
   * @returns the finded user
   */
  async findUserByTokenAndExpireDate(token: string) {
    const userDB = await this.userRepository.findOne({
      where: { forgotPassToken: token },
    });
    if (!userDB || !userDB.forgotPassExpires)
      throw new HttpException(
        { message: "Token expirado ou inválido." },
        HttpStatus.FORBIDDEN,
      );

    if (userDB.forgotPassToken == "")
      throw new HttpException(
        { message: "A senha já foi alterada." },
        HttpStatus.FORBIDDEN,
      );

    const currentTime = new Date();
    const expires = new Date(userDB.forgotPassExpires);

    if (currentTime > expires)
      throw new HttpException(
        { message: "Token expirado ou inválido." },
        HttpStatus.FORBIDDEN,
      );

    return userDB;
  }

  async loginWithGoogle(userFromGoogle: any, res: Response) {
    if (!userFromGoogle) {
      return "Unexpected error.";
    }

    const user = await this.userRepository.findOneBy({ email: userFromGoogle.email });
    let register;

    if (!user) {
      register = await this.registerUser(
        {
          email: userFromGoogle.email,
          password: "GoogleSigned",
          username: userFromGoogle.firstName,
        },
        "pt",
      );
    }

    const queryParams = new URLSearchParams({
      userId: user ? user.id : register.user.id,
      username: user ? user.username : register.user.username,
      email: user ? user.email : register.user.email,
    }).toString();

    return res.redirect(`http://localhost:5173/home?${queryParams}`);
  }
}
