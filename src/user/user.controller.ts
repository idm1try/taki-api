import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Patch,
    Req,
    UseGuards,
} from '@nestjs/common';
import { RequestWithParsedPayload } from '../auth/auth.type';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DeleteUserDto } from './dto/delete-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    getUserProfile(@Req() req: RequestWithParsedPayload) {
        return this.userService.getUserProfile(req.user.userId);
    }

    @Patch()
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    updateAccountInfo(
        @Req() req: RequestWithParsedPayload,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return this.userService.update(req.user.userId, updateUserDto);
    }

    @Delete()
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    deleteUser(
        @Req() { user }: RequestWithParsedPayload,
        @Body() deleteUserDto: DeleteUserDto,
    ) {
        return this.userService.delete(user.userId, deleteUserDto);
    }
}
