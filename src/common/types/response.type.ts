import { HttpException } from '@nestjs/common';

export type APIResponse<T> = Promise<T | HttpException>;
