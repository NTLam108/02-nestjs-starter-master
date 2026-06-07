import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { Job, JobDocument } from 'src/jobs/schemas/job.schema';
import {
  Permission,
  PermissionDocument,
} from 'src/permissions/schemas/permission.schema';
import { Role, RoleDocument } from 'src/roles/schemas/role.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { UsersService } from 'src/users/users.service';
import { ADMIN_ROLE, INIT_PERMISSIONS, USER_ROLE } from './sample';

@Injectable()
export class DatabasesService implements OnModuleInit {
  private readonly logger = new Logger(DatabasesService.name);
  constructor(
    @InjectModel(Role.name) private roleModel: SoftDeleteModel<RoleDocument>,
    @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
    @InjectModel(Permission.name)
    private permissionModel: SoftDeleteModel<PermissionDocument>,

    private configService: ConfigService,
    private userService: UsersService,
  ) {}
  async onModuleInit() {
    const isInit = this.configService.get<string>('SHOULD_INIT');
    if (Boolean(isInit)) {
      const countPermission = await this.permissionModel.count({});

      //create permission
      if (countPermission === 0) {
        await this.permissionModel.insertMany(INIT_PERMISSIONS);
      }

      const countRole = await this.roleModel.count({});
      if (countRole === 0) {
        const permissions = await this.permissionModel.find({}).select('_id');

        if (permissions.length > 0) {
          await this.roleModel.insertMany([
            {
              name: ADMIN_ROLE,
              description: 'Admin có full quyền sử dụng hệ thống!',
              isActive: true,
              permissions: permissions,
            },
            {
              name: USER_ROLE,
              description: 'USER bình thường, có một số quyền nhất định',
              isActive: true,
              permissions: [],
            },
          ]);
        } else {
          this.logger.error(
            '>>> LỖI: Không tìm thấy Permission nào để gán cho Role!',
          );
        }
      }

      const countUser = await this.userModel.count({});
      if (countUser === 0) {
        const adminRole = await this.roleModel.findOne({ name: ADMIN_ROLE });
        const userRole = await this.roleModel.findOne({ name: USER_ROLE });
        const initPassword = this.configService.get<string>('INIT_PASSWORD');

        const hashAdminPassword = await this.userService.hashPassword(
          initPassword,
        );
        const hashUserPassword = await this.userService.hashPassword(
          initPassword,
        );
        await this.userModel.insertMany([
          {
            name: "I'm admin",
            email: 'admin@gmail.com',
            password: hashAdminPassword,
            age: 69,
            gender: 'MALE',
            address: 'VietNam',
            role: adminRole?._id,
          },
          {
            name: 'Nguyen Trong Lam',
            email: 'lam.nt108204@gmail.com',
            password: hashAdminPassword,
            age: 96,
            gender: 'MALE',
            address: 'VietNam',
            role: adminRole?._id,
          },
          {
            name: "I'm normal user",
            email: 'user@gmail.com',
            password: hashUserPassword,
            age: 69,
            gender: 'MALE',
            address: 'VietNam',
            role: userRole?._id,
          },
        ]);
      }

      if (countUser > 0 && countRole > 0 && countPermission > 0) {
        this.logger.log('>>> ALREADY INIT SAMPLE DATA...');
      }
    }
  }
}
