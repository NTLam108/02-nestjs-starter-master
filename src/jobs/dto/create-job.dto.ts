import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import mongoose from 'mongoose';

export class Company {
  @IsNotEmpty({ message: 'Id khong duoc de trong.' })
  _id: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty({ message: 'Ten cong ty khong duoc de trong.' })
  name: string;

  @IsNotEmpty({ message: 'Logo Cong ty khong duoc de trong.' })
  logo: string;
}
export class CreateJobDto {
  @IsNotEmpty({ message: 'Name khong duoc de trong' })
  name: string;

  @IsNotEmpty({ message: 'Skill khong duoc de trong.' })
  @IsArray({ message: 'Skill có định dạng là array' })
  @IsString({ each: true, message: 'Skill định dạng là string' })
  skills: string[];

  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => Company)
  company: Company;

  @IsNotEmpty({ message: 'Location khong duoc de trong.' })
  location: string;

  @IsNotEmpty({ message: 'Salary khong duoc de trong.' })
  salary: number;

  @IsNotEmpty({ message: 'Quantity khong duoc de trong.' })
  quantity: number;

  @IsNotEmpty({ message: 'Level khong duoc de trong.' })
  level: string;

  @IsNotEmpty({ message: 'Description Date khong duoc de trong.' })
  description: string;

  @IsNotEmpty({ message: 'startDate khong duoc de trong.' })
  @Transform(({ value }) => new Date(value))
  @IsDate({ message: 'startDate có định dạng là Date' })
  startDate: Date;

  @IsNotEmpty({ message: 'endDate khong duoc de trong.' })
  @Transform(({ value }) => new Date(value))
  @IsDate({ message: 'endDate có định dạng là Date' })
  endDate: Date;

  @IsNotEmpty({ message: 'Trang thai cong viec khong duoc de trong.' })
  @IsBoolean({ message: 'isActive có định dạng là Boolean' })
  isActive: boolean;
}
