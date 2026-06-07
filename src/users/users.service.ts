import {
  BadRequestException,
  ConflictException,
  HttpCode,
  Injectable,
  NotFoundException,
  Response,
} from '@nestjs/common';
import { CreateUserDto, RegisterUserDTO } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from './users.interface';
import aqp from 'api-query-params';
import { Role, RoleDocument } from 'src/roles/schemas/role.schema';
import { USER_ROLE } from 'src/databases/sample';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
    @InjectModel(Role.name) private roleModel: SoftDeleteModel<RoleDocument>,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  async register(registerUserDTO: RegisterUserDTO) {
    const { name, email, password, age, gender, address } = registerUserDTO;

    const isExisted = await this.userModel.findOne({ email });
    if (isExisted) {
      throw new BadRequestException(
        `Email: ${email} đã tồn tại. Vui lòng tạo lại tài khoản với email khác!`,
      );
    }

    //fetch user role
    const userRole = await this.roleModel.findOne({ name: USER_ROLE });

    const hashPassword = await this.hashPassword(password);
    return await this.userModel.create({
      name,
      email,
      password: hashPassword,
      age,
      gender,
      address,
      role: userRole?._id,
    });
  }
  async create(createUserDto: CreateUserDto, user: IUser) {
    const { name, email, password, age, gender, address, company, role } =
      createUserDto;

    const isExisted = await this.userModel.findOne({ email });
    if (isExisted) {
      throw new BadRequestException(
        `Email: ${email} đã tồn tại. Vui lòng tạo lại tài khoản với email khác!`,
      );
    }

    const hashPassword = await this.hashPassword(password);
    const newUser = await this.userModel.create({
      name,
      email,
      password: hashPassword,
      age,
      gender,
      address,
      company,
      role,
      createdBy: {
        _id: user._id,
        email: user.email,
      },
    });

    return {
      _id: newUser._id,
      createdAt: newUser.createdAt,
    };
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, projection, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    const offset = (+currentPage - 1) * +limit;
    const defaultLimit = +limit ? +limit : 10;
    const totalItems = (await this.userModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);
    const result = await this.userModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .select('-password')
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
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new NotFoundException(`User with ID: ${id} is not found!`);
      }
      return await this.userModel
        .findOne({
          _id: id,
        })
        .select('-password')
        .populate({ path: 'role', select: { _id: 1, name: 1 } });
    } catch (error) {
      console.error();
    }
  }

  async update(updateUserDto: UpdateUserDto, user: IUser) {
    return await this.userModel.updateOne(
      {
        _id: updateUserDto._id,
      },
      {
        ...updateUserDto,
        updatedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );
  }

  async remove(id: string, user: IUser) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new NotFoundException(`User with id: ${id} is not found`);
      }

      const foundUser = await this.userModel.findById({ _id: id });
      if (foundUser.email === 'admin@gmail.com')
        throw new BadRequestException('Không thể xóa tài khoản admin');

      await this.userModel.updateOne(
        {
          _id: id,
        },
        {
          deletedBy: {
            _id: user._id,
            email: user.email,
          },
        },
      );
      return this.userModel.softDelete({
        _id: id,
      });
    } catch (error) {
      console.error();
    }
  }

  async findOneByUsername(username: string) {
    try {
      return await this.userModel
        .findOne({
          email: username,
        })
        .populate({ path: 'role', select: { name: 1 } });
    } catch (error) {
      throw error;
    }
  }

  isValidPassword(password: string, hash: string) {
    const match = bcrypt.compareSync(password, hash);
    return match;
  }

  updateUserToken = async (refreshToken: string, _id: string) => {
    await this.userModel.updateOne(
      {
        _id,
      },
      {
        refreshToken,
      },
    );
  };

  findUserbyToken = async (refreshToken: string) => {
    return (await this.userModel.findOne({ refreshToken })).populate({
      path: 'role',
      select: { name: 1 },
    });
  };
}
