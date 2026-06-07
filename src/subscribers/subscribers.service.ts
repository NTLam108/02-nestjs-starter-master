import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Subscriber, SubscriberDocument } from './schemas/subscriber.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from 'src/users/users.interface';
import aqp from 'api-query-params';
import mongoose from 'mongoose';
import { NotFoundError } from 'node_modules/rxjs/dist/types';

@Injectable()
export class SubscribersService {
  constructor(
    @InjectModel(Subscriber.name)
    private subscriberModel: SoftDeleteModel<SubscriberDocument>,
  ) {}

  async create(createSubscriberDto: CreateSubscriberDto, user: IUser) {
    try {
      const { email, name, skills } = createSubscriberDto;
      const isExist = await this.subscriberModel.exists({ email });
      if (isExist) {
        throw new BadRequestException(
          `Email: ${email} đã tồn tại trên hệ thống.`,
        );
      }
      const newSubscriber = await this.subscriberModel.create({
        email,
        name,
        skills,
        createdBy: {
          _id: user._id,
          email: user.email,
        },
      });

      return {
        _id: newSubscriber?._id,
        createdAt: newSubscriber?.createdAt,
      };
    } catch (error) {
      throw new BadRequestException('Không thể tạo mới Subscriber');
    }
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    const offset = (+currentPage - 1) * +limit;
    const defaultLimit = +limit ? +limit : 10;
    const totalItems = (await this.subscriberModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);
    const result = await this.subscriberModel
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
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestException("Subscribe's id is not valid");
      }
      return await this.subscriberModel.findById({ _id: id });
    } catch (error) {
      throw new NotFoundException(`Không tìm thấy subscriber có id: ${id}`);
    }
  }

  async update(updateSubscriberDto: UpdateSubscriberDto, user: IUser) {
    try {
      return await this.subscriberModel.updateOne(
        { email: user.email },
        {
          ...updateSubscriberDto,
          updatedBy: {
            _id: user._id,
            email: user.email,
          },
        },
        { upsert: true },
      );
    } catch (error) {
      console.log(error);
    }
  }

  async remove(id: string, user: IUser) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestException("Subscribe's id is not valid");
      }

      await this.subscriberModel.updateOne(
        { _id: id },
        {
          deletedBy: {
            _id: user._id,
            email: user.email,
          },
        },
      );

      return await this.subscriberModel.softDelete({ _id: id });
    } catch (error) {
      console.log(error);
      throw new NotFoundException(`Không tìm thấy subscriber có id: ${id}`);
    }
  }

  async getSkills(user: IUser) {
    return await this.subscriberModel.findOne(
      {
        email: user.email,
      },
      { skills: 1 },
    );
  }
}
