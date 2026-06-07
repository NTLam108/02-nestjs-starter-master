import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { IUser } from 'src/users/users.interface';
import mongoose from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Permission, PermissionDocument } from './schemas/permission.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import aqp from 'api-query-params';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name)
    private permissionModel: SoftDeleteModel<PermissionDocument>,
  ) {}

  //Create new Permission
  async create(createPermissionDto: CreatePermissionDto, user: IUser) {
    const { name, apiPath, method, module } = createPermissionDto;
    try {
      const isExisted = await this.permissionModel.exists({
        method: method,
        apiPath: apiPath,
      });

      if (isExisted)
        throw new ConflictException(
          `Cặp Method: ${method} & API: ${apiPath} đã tồn tại!`,
        );

      const newPermission = await this.permissionModel.create({
        name,
        apiPath,
        method,
        module,
        createdBy: {
          _id: user._id,
          email: user.email,
        },
      });

      return {
        _id: newPermission?._id,
        createdAt: newPermission?.createdAt,
      };
    } catch (error: any) {
      if (error.code === 11000)
        throw new ConflictException(
          'Cặp Method + API này đã được đăng ký trước đó.',
        );

      console.log(error);
      throw new InternalServerErrorException('Có lỗi xảy ra tại máy chủ.');
    }
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    const offset = (+currentPage - 1) * +limit;
    const defaultLimit = +limit ? +limit : 10;
    const totalItems = (await this.permissionModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);
    const result = await this.permissionModel
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
        throw new BadRequestException(`Permission id: ${id} is not valid`);

      return await this.permissionModel.findById({ _id: id });
    } catch (error) {
      throw error;
    }
  }

  async update(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
    user: IUser,
  ) {
    const { name, apiPath, method, module } = updatePermissionDto;
    try {
      if (!mongoose.Types.ObjectId.isValid(id))
        throw new BadRequestException(`Permission id: ${id} is not valid`);

      if (method && apiPath) {
        const isExisted = await this.permissionModel.exists({
          _id: { $ne: id },
          method,
          apiPath,
        });

        if (isExisted)
          throw new ConflictException(
            `Cặp Method: ${method} & API: ${apiPath} đã tồn tại!`,
          );
      }

      return await this.permissionModel.updateOne(
        { _id: id },
        {
          name,
          apiPath,
          method,
          module,
          updatedBy: {
            _id: user._id,
            email: user.email,
          },
        },
      );
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string, user: IUser) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id))
        throw new BadRequestException(`Permission id: ${id} is not valid`);

      await this.permissionModel.updateOne(
        { _id: id },
        {
          deletedBy: {
            _id: user._id,
            email: user.email,
          },
        },
      );

      return this.permissionModel.softDelete({ _id: id });
    } catch (error) {
      throw error;
    }
  }
}
