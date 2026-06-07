//data transfer object

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import mongoose from 'mongoose';

export class Company {
  @IsNotEmpty({ message: 'Id Company không được để trống.' })
  _id: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty({ message: 'Company Name không được để trống.' })
  name: string;
}
export class CreateUserDto {
  @IsNotEmpty({ message: 'Name không được để trống.' })
  name: string;

  @IsEmail({}, { message: 'Email không đúng định dạng.' })
  @IsNotEmpty({ message: 'Email không được để trống.' })
  email: string;

  @IsNotEmpty({ message: 'Password không được để trống.' })
  password: string;

  @IsNotEmpty({ message: 'Age không được để trống.' })
  age: number;

  @IsNotEmpty({ message: 'Gender không được để trống.' })
  gender: string;

  @IsNotEmpty({ message: 'Address không được để trống.' })
  address: string;

  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => Company)
  company: Company;

  @IsNotEmpty({ message: 'Role khong duoc de trong' })
  @IsMongoId({ message: 'Role có định dạng là mongo ID' })
  role: mongoose.Schema.Types.ObjectId;
}

export class RegisterUserDTO {
  @IsNotEmpty({ message: 'Name không được để trống.' })
  name: string;

  @IsEmail({}, { message: 'Email không đúng định dạng.' })
  @IsNotEmpty({ message: 'Email không được để trống.' })
  email: string;

  @IsNotEmpty({ message: 'Password không được để trống.' })
  password: string;

  @IsNotEmpty({ message: 'Age không được để trống.' })
  age: number;

  @IsNotEmpty({ message: 'Gender không được để trống.' })
  gender: string;

  @IsNotEmpty({ message: 'Address không được để trống.' })
  address: string;
}

export class UserLoginDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'lam.nt108204@gmail.com', description: 'username' })
  readonly username: string;
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '123456',
    description: 'password',
  })
  readonly password: string;
}
