import {
    Body,
    Controller,
    Delete,
    FileTypeValidator,
    Get,
    HttpCode,
    HttpStatus,
    ParseFilePipe,
    Patch,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { RequestWithParsedPayload } from "../auth/auth.type";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
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
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new FileTypeValidator({ fileType: /image\/(png|jpe?g)/ }),
                ],
            }),
        )
        avatar: Express.Multer.File,
    ) {
        return this.userService.updateAvatar({
            userId: req.user.userId,
            avatar,
        });
    }

    @Delete("avatar")
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async deleteUserAvatar(@Req() req: RequestWithParsedPayload) {
        return this.userService.deleteAvatar(req.user.userId);
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
