import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/users/users.interface';
import { RegisterUserDTO } from 'src/users/dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import { Response } from 'express';
import { RolesService } from 'src/roles/roles.service';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private rolesService: RolesService,
  ) {}
  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByUsername(username);
    if (user) {
      const isValid = this.usersService.isValidPassword(pass, user.password);
      if (isValid === true) {
        const userRole = user.role as unknown as { _id: string; name: string };
        const userPermission = await this.rolesService.findOne(userRole._id);

        const objUser = {
          ...user.toObject(),
          permissions: userPermission?.permissions ?? [],
        };
        return objUser;
      }
    }
    return null;
  }

  async login(user: IUser, response: Response) {
    const { _id, name, email, role, permissions } = user;
    const payload = {
      sub: 'token login',
      iss: 'from server',
      _id,
      name,
      email,
      role,
    };
    const refreshToken = this.createRefreshToken(payload);

    //update user with refresh token
    await this.usersService.updateUserToken(refreshToken, _id);

    //set refreshToken as cookies
    response.cookie('refresh_Token', refreshToken, {
      httpOnly: true,
      maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')),
    });
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id,
        name,
        email,
        role,
        permissions,
      },
    };
  }

  async register(registerUserDTO: RegisterUserDTO) {
    const registerUser = await this.usersService.register(registerUserDTO);
    return {
      _id: registerUser?._id,
      createdAt: registerUser?.createdAt,
    };
  }

  createRefreshToken = (payload: any) => {
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn:
        ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')) / 1000,
    });
    return refreshToken;
  };

  processNewToken = async (refreshToken: string, response: Response) => {
    try {
      this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });

      const user = await this.usersService.findUserbyToken(refreshToken);
      if (user) {
        //update refresh_token
        const { _id, name, email, role } = user;
        const payload = {
          sub: 'token refresh',
          iss: 'from server',
          _id,
          name,
          email,
          role,
        };
        const refreshToken = this.createRefreshToken(payload);

        //update user with refresh token
        await this.usersService.updateUserToken(refreshToken, _id.toString());

        //fetch user's role
        const userRole = user.role as unknown as { _id: string; name: string };
        const userPermission = await this.rolesService.findOne(userRole._id);
        //set refreshToken as cookies
        response.clearCookie('refresh_Token');
        response.cookie('refresh_Token', refreshToken, {
          httpOnly: true,
          maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')),
        });
        return {
          access_token: this.jwtService.sign(payload),
          user: {
            _id,
            name,
            email,
            role,
            permissions: userPermission?.permissions ?? [],
          },
        };
      } else {
        throw new BadRequestException(
          `Refresh token không hợp lệ. Vui lòng Login!`,
        );
      }
    } catch (error) {
      throw new BadRequestException(
        `Refresh token không hợp lệ. Vui lòng Login!`,
      );
    }
  };

  logoutUser = async (user: IUser, response: Response) => {
    //update refreshToken
    await this.usersService.updateUserToken('', user._id);

    //Remove refreshToken in Cookies
    response.clearCookie('refresh_Token');
    return 'ok';
  };
}
