import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { RequestWithParsedPayload } from "../auth/auth.type";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { SharpPipe } from "../common/pipes/sharp.pipe";
import { DeleteUserDto } from "./dto/delete-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserService } from "./user.service";

@Controller("user")
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
    async updateUserInfo(
        @Req() req: RequestWithParsedPayload,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return this.userService.update(req.user.userId, updateUserDto);
    }

    @Patch("avatar")
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor("avatar"))
    @HttpCode(HttpStatus.OK)
    async setUserAvatar(
        @Req() req: RequestWithParsedPayload,
        @UploadedFile(SharpPipe) avatar: string,
    ) {
        return this.userService.updateAvatar({
            userId: req.user.userId,
            avatar,
        });
    }

    @Get("avatar/:avatarFileName")
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async getUserAvatar(
        @Req() req: RequestWithParsedPayload,
        @Param() { avatarFileName }: { avatarFileName: string },
    ) {
        return this.userService.getAvatar(req.user.userId, avatarFileName);
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
