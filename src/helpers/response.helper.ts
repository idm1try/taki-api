import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export type IAPIResponse<T> = Promise<
  { data: T; message: string } | HttpException
>;

export class APIResponse {
  public static Error(
    status: HttpStatus,
    errors: { [key: string]: string },
  ): HttpException {
    return new HttpException(
      {
        status,
        errors,
      },
      status,
    );
  }

  public static Success<T>(
    data: T,
    message: string,
  ): { data: T; message: string } {
    return { data, message };
  }
}

export class ResponseError {
  @ApiProperty({ type: String })
  public status: HttpStatus;
  @ApiProperty({ type: {} })
  public errors: { [key: string]: string };
}

export class ResponseSuccess<T> {
  @ApiProperty()
  public data: T;
  @ApiProperty({ type: String })
  public message: string;
}
