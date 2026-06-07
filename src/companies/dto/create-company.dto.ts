import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateCompanyDto {
  @IsNotEmpty({ message: 'Logo công ty không được để trống.' })
  logo: string;

  @IsNotEmpty({ message: 'Tên công ty không được để trống.' })
  name: string;

  @IsNotEmpty({ message: 'Địa chỉ công ty không được để trống.' })
  address: string;

  @IsNotEmpty({ message: 'Thông tin công ty không được để trống.' })
  description: string;
}
