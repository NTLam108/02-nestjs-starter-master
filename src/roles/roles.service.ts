import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from 'src/users/users.interface';
import mongoose from 'mongoose';
import aqp from 'api-query-params';
import { ADMIN_ROLE } from 'src/databases/sample';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name)
    private roleModel: SoftDeleteModel<RoleDocument>,
  ) {}

  async create(createRoleDto: CreateRoleDto, user: IUser) {
    const { name, description, isActive, permissions } = createRoleDto;
    try {
      const isExisted = await this.roleModel.exists({ name });
      if (isExisted)
        throw new BadRequestException(`Role's name: ${name} is existed!`);

      const newRole = await this.roleModel.create({
        name,
        description,
        isActive,
        permissions,
        createdBy: {
          _id: user._id,
          email: user.email,
        },
      });

      return {
        _id: newRole?._id,
        createdAt: newRole?.createdAt,
      };
    } catch (error) {
      throw error;
    }
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    const offset = (+currentPage - 1) * +limit;
    const defaultLimit = +limit ? +limit : 10;
    const totalItems = (await this.roleModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);
    const result = await this.roleModel
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

  async findOne(id: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id))
        throw new BadRequestException(`Role id: ${id} is not valid`);

      return (await this.roleModel.findById({ _id: id })).populate({
        path: 'permissions',
        select: { _id: 1, apiPath: 1, name: 1, method: 1, module: 1 },
      });
    } catch (error: any) {
      if (error.code === 404)
        throw new NotFoundException(`Not found Role have id: ${id}`);

      throw error;
    }
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, user: IUser) {
    try {
      const { name, description, isActive, permissions } = updateRoleDto;
      if (!mongoose.Types.ObjectId.isValid(id))
        throw new BadRequestException(`Role id: ${id} is not valid`);

      await this.roleModel.updateOne(
        { _id: id },
        {
          name,
          description,
          isActive,
          permissions,
          updatedBy: {
            _id: user._id,
            email: user.email,
          },
        },
      );
    } catch (error: any) {
      if (error.code === 404)
        throw new NotFoundException(`Not found Role have id: ${id}`);

      throw error;
    }
  }

  async remove(id: string, user: IUser) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id))
        throw new BadRequestException(`Role id: ${id} is not valid`);

      //không thể xóa role có tên là admin
      const foundRole = await this.roleModel.findById({ _id: id });
      if (foundRole.name === ADMIN_ROLE)
        throw new BadRequestException('Không thể xóa role có tên là Admin');

      await this.roleModel.updateOne(
        { _id: id },
        {
          deletedBy: {
            _id: user._id,
            email: user.email,
          },
        },
      );

      return this.roleModel.softDelete({ _id: id });
    } catch (error: any) {
      if (error.code === 404)
        throw new NotFoundException(`Not found Role have id: ${id}`);

      throw error;
    }
  }
}
