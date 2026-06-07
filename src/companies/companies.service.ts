import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company, CompanyDocument } from './schemas/company.schema';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from 'src/users/users.interface';
import mongoose from 'mongoose';
import aqp from 'api-query-params';
@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name)
    private companyModel: SoftDeleteModel<CompanyDocument>,
  ) {}
  async create(createCompanyDto: CreateCompanyDto, user: IUser) {
    try {
      const company = await this.companyModel.create({
        logo: createCompanyDto.logo,
        name: createCompanyDto.name,
        address: createCompanyDto.address,
        description: createCompanyDto.description,
        createdBy: {
          _id: user._id,
          email: user.email,
        },
      });
      return company;
    } catch (error) {
      console.log(error);
    }
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, projection, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    const offset = (+currentPage - 1) * +limit;
    const defaultLimit = +limit ? +limit : 10;
    const totalItems = (await this.companyModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);
    const result = await this.companyModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate(population)
      .exec();

    return {
      meta: {
        current: currentPage, //trang hiện tại
        pageSize: limit, //số lượng bản ghi đã lấy
        pages: totalPages, //tổng số trang với điều kiện query
        total: totalItems, // tổng số phần tử (số bản ghi)
      },
      result, //kết quả query
    };
  }

  findOne = async (id: string) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new NotFoundException(`Không tìm thấy Company nào có _id: ${id}`);
      }
      return await this.companyModel.findOne({ _id: id });
    } catch (error) {
      console.log(error);
    }
  };

  async update(id: string, updateCompanyDto: UpdateCompanyDto, user: IUser) {
    try {
      return await this.companyModel.updateOne(
        {
          _id: id,
        },
        {
          ...updateCompanyDto,
          updatedBy: {
            _id: user._id,
            email: user.email,
          },
        },
      );
    } catch (error) {
      console.log(error);
    }
  }

  async remove(id: string, user: IUser) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new NotFoundException(`Không tồn tại Company nào có _id: ${id}`);
      }
      await this.companyModel.updateOne(
        { _id: id },
        {
          deletedBy: {
            _id: user._id,
            email: user.email,
          },
        },
      );
      return this.companyModel.softDelete({ _id: id });
    } catch (error) {
      console.log(error);
    }
  }
}
