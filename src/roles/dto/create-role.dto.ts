import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import mongoose from 'mongoose';

export class CreateRoleDto {
  @IsNotEmpty({ message: 'Name không được để trống.' })
  name: string;

  @IsNotEmpty({ message: 'Description không được để trống.' })
  description: string;

  @IsNotEmpty({ message: 'isActive không được để trống' })
  @IsBoolean({ message: 'isActive kiểu dữ liệu là boolean' })
  isActive: boolean;

  @IsNotEmpty({ message: 'Permissions không được để trống' })
  @IsMongoId({
    each: true,
    message:
      'Mỗi phần tử trong mảng permissions đều phải có dạng mông object id',
  })
  @IsArray({ message: 'Permissions phải có dạng Array' })
  permissions: mongoose.Schema.Types.ObjectId[];
}
