import {
  Controller, Post, UploadedFile, UseGuards, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueName = uuid() + extname(file.originalname);
    cb(null, uniqueName);
  },
});

@ApiTags('Upload')
@Controller('upload')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UploadController {
  @Post('image')
  @ApiOperation({ summary: 'Upload ảnh' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', {
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = /\.(jpg|jpeg|png|webp|gif)$/i;
      if (!allowed.test(file.originalname)) return cb(new BadRequestException('Chỉ chấp nhận file ảnh'), false);
      cb(null, true);
    },
  }))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Không có file được upload');
    return { url: `/uploads/${file.filename}`, filename: file.filename };
  }

  @Post('file')
  @ApiOperation({ summary: 'Upload file (PDF, DOC...)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', {
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = /\.(pdf|doc|docx|xls|xlsx|png|jpg|jpeg)$/i;
      if (!allowed.test(file.originalname)) return cb(new BadRequestException('Định dạng file không được hỗ trợ'), false);
      cb(null, true);
    },
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Không có file được upload');
    return { url: `/uploads/${file.filename}`, filename: file.filename, originalName: file.originalname };
  }
}
