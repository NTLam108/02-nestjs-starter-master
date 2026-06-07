import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    //model (thao tac voi database)
    return 'Hello World! LamVoi render with ViewEngine (EJS)';
  }
}
