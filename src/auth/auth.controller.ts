import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { RegisterUserDTO, UserLoginDto } from 'src/users/dto/create-user.dto';
import { Request, Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IUser } from 'src/users/users.interface';
import { RolesService } from 'src/roles/roles.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiBody, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private rolesService: RolesService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @UseGuards(ThrottlerGuard)
  @ApiBody({ type: UserLoginDto })
  @ResponseMessage('User Login')
  @Post('login')
  handleLogin(@Req() req, @Res({ passthrough: true }) response: Response) {
    return this.authService.login(req.user, response);
  }

  @Public()
  @ResponseMessage('Register a new user')
  @Post('register')
  handleRegister(@Body() registerUserDTO: RegisterUserDTO) {
    return this.authService.register(registerUserDTO);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Get user information')
  @Get('account')
  async getUserAccount(@User() user: IUser) {
    const accountRole = (await this.rolesService.findOne(user.role._id)) as any;
    user.permissions = accountRole.permissions;
    return { user };
  }

  @Public()
  @ResponseMessage('Get User by Refresh Token')
  @Get('refresh')
  getUserToken(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = req.cookies['refresh_Token'];
    return this.authService.processNewToken(refreshToken, response);
  }

  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Logout User')
  @Post('logout')
  handleLogout(
    @User() user: IUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logoutUser(user, response);
  }
}
