import { IsArray, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateSubscriberDto {
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({ message: 'Email phải đúng định dạng' })
  email: string;

  @IsNotEmpty({ message: 'Name không được để trống.' })
  name: string;

  @IsNotEmpty({ message: 'Skills không được để trống' })
  @IsArray({ message: 'Skills định dạng là một mảng' })
  @IsString({ each: true, message: 'Skill định dạng là string' })
  skills: string[];
}
