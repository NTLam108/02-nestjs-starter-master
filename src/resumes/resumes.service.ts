import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateResumeDto, CreateUserCvDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { Resume, ResumeDocument } from './schemas/resume.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from 'src/users/users.interface';
import { ResponseMessage } from 'src/decorator/customize';
import aqp from 'api-query-params';
import mongoose from 'mongoose';

@Injectable()
export class ResumesService {
  constructor(
    @InjectModel(Resume.name)
    private resumeModel: SoftDeleteModel<ResumeDocument>,
  ) {}

  async create(createUserCvDto: CreateUserCvDto, user: IUser) {
    const { url, companyId, jobId } = createUserCvDto;
    const { _id, email } = user;
    const newResume = await this.resumeModel.create({
      email: email,
      userId: _id,
      status: 'PENDING',
      history: [
        {
          status: 'PENDING',
          updatedAt: new Date(),
          updatedBy: {
            _id: user._id,
            email: user.email,
          },
        },
      ],
      url,
      companyId,
      jobId,
      createdBy: {
        _id: user._id,
        email: user.email,
      },
    });
    return {
      _id: newResume?._id,
      createdAt: newResume?.createdAt,
    };
  }

  findAll = async (currentPage: number, limit: number, qs: string) => {
    const { filter, sort, population, projection } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    const offset = (+currentPage - 1) * +limit;
    const defaultLimit = +limit ? +limit : 10;
    const totalItems = (await this.resumeModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);
    const result = await this.resumeModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate(population)
      .select(projection as any)
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
  };

  findOne = async (id: string) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`Resume Id: ${id} is not valid`);
      }
      return await this.resumeModel.findById({ _id: id });
    } catch (error) {
      console.log(error);
      throw new NotFoundException(`Không tìm thấy Resume có _id: ${id}`);
    }
  };

  update = async (id: string, status: string, user: IUser) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`Id: ${id} is not valid`);
      }
      return await this.resumeModel.updateOne(
        {
          _id: id,
        },
        {
          status,
          $push: {
            history: {
              status,
              updatedAt: new Date(),
              updatedBy: {
                _id: user._id,
                email: user.email,
              },
            },
          },
          updatedBy: {
            _id: user._id,
            email: user.email,
          },
        },
      );
    } catch (error) {
      console.log(error);
      throw new NotFoundException(`Không tìm thấy resume có _id: ${id}`);
    }
  };

  remove = async (id: string, user: IUser) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`Resume id: ${id} is not valid`);
      }
      await this.resumeModel.updateOne(
        { _id: id },
        {
          deletedBy: {
            _id: user._id,
            email: user.email,
          },
        },
      );
      return this.resumeModel.softDelete({ _id: id });
    } catch (error) {
      console.log(error);
      throw new NotFoundException(`Không tìm thấy Resume có id: ${id}`);
    }
  };

  getbyuser = async (user: IUser) => {
    return await this.resumeModel
      .find({ userId: user._id })
      .sort('-createdAt')
      .populate([
        { path: 'companyId', select: { name: 1 } },
        { path: 'jobId', select: { name: 1 } },
      ]);
  };
}
