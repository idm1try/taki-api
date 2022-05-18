import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequestWithParsedPayload } from '../auth/auth.type';
import { JwtAccessGuard } from '../auth/guard/jwt-access.guard';
import { CreateNoteDto } from './dto/create-note.dto';
import { DeleteManyNotesDto } from './dto/delete-many-notes.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteService } from './note.service';

@ApiTags('notes')
@Controller('notes')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Post()
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  create(
    @Req() req: RequestWithParsedPayload,
    @Body() createNoteDto: CreateNoteDto,
  ) {
    return this.noteService.create(req.user.userId, createNoteDto);
  }

  @Get()
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  getAll(
    @Req() req: RequestWithParsedPayload,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.noteService.getAll(req.user.userId, skip, limit);
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  deleteOne(@Req() req: RequestWithParsedPayload, @Param('id') id: string) {
    return this.noteService.deleteOne(req.user.userId, id);
  }

  @Delete()
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  deleteMany(
    @Req() req: RequestWithParsedPayload,
    @Body() deleteManyNotesDto: DeleteManyNotesDto,
  ) {
    return this.noteService.deleteMany(
      req.user.userId,
      deleteManyNotesDto.noteIds,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  update(
    @Req() req: RequestWithParsedPayload,
    @Body() updateNoteDto: UpdateNoteDto,
    @Param('id') id: string,
  ) {
    return this.noteService.update(req.user.userId, id, updateNoteDto);
  }
}