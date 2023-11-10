import { BadRequestException, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import _ from 'lodash';

import { Roles } from '@/app/decorators/roles.decorator';
import { RolesGuard } from '@/app/guards/roles.guard';
import { ModifiedUser, RolesEnum, User } from '@/app/models/user';
import { S3Provider } from '@/app/providers/s3.provider';
import { FileService } from '@/app/services/files/files.service';
// import { FilesService } from '@/app/services/files/file.service';
import { UsersService } from '@/app/services/users/users.service';
import { Authorized, MpplatformApiDefault } from '@/app/utils/decorators';

@ApiTags('files')
@MpplatformApiDefault()
@Authorized()
@Controller('files')
@UseGuards(RolesGuard)
export class FilesController {
  constructor(
    private readonly usersService: UsersService,
    private readonly filesService: FileService,
    private readonly s3Provider: S3Provider,
  ) {}

  @ApiOperation({ summary: 'Upload new files.' })
  @Post('upload')
  @Roles(RolesEnum.company, RolesEnum.admin)
  async uploadMultipleFiles(@Req() request: FastifyRequest) {
    if (!request.isMultipart()) {
      throw new BadRequestException('Request is not multipart');
    }

    const uid: string = request.raw.user.uid;
    const user = await this.usersService.getUser(uid);

    const files = await request.saveRequestFiles();
    const uploadResults = await this.uploadAndSaveFiles(files, user);

    return { files: uploadResults };
  }

  private async uploadAndSaveFiles(files: any[], user: ModifiedUser) {
    return Promise.all(files.map(async (file) => this.uploadAndSaveSingleFile(file, user)));
  }

  private async uploadAndSaveSingleFile(file: any, user: ModifiedUser) {
    const contentType = file.mimetype;
    const s3Key = await this.s3Provider.uploadFile(file, contentType, user.role, 'infoDetail');
    // const presignedUrl = await this.s3Provider.getPreSignedUrl(s3Key);

    const savedFile = await this.filesService.createFile({
      name: file.filename,
      type: file.mimetype,
      size: file.size,
      path: s3Key,
      user: user as User,
    });

    return { originalName: file.filename, id: savedFile.id, path: savedFile.path };
  }
}

// @ApiOperation({ summary: 'Upload new files.' })
// @Post('upload')
// @Roles(RolesEnum.company, RolesEnum.admin)
// async uploadMultipleFiles(@Req() request: FastifyRequest, @Res() reply: FastifyReply) {
//   try {
//     // Check if the request supports saving files
//     if ('saveRequestFiles' in request) {
//       const uid: string = request.user.uid;
//       // Retrieve the user from the database
//       // const user = await this.usersService.getUser(uid);

//       // Save the files from the request
//       const files = await request.saveRequestFiles();
//       // Upload each file to S3 and wait for all to finish
//       const uploadPromises = files.map((file) => this.s3Provider.uploadFile(file));
//       const uploadResults = await Promise.all(uploadPromises);

//       // Save file information in the database
//       // const saveFilePromises = uploadResults.map((fileLocation) =>
//       //   this.fileService.create({
//       //     userId: user.id,
//       //     path: fileLocation,
//       //     name: fileLocation.filename,
//       //     type: fileLocation.mimetype,
//       //     size: fileLocation.size,
//       //     user: user,
//       //   }),
//       // );
//       // await Promise.all(saveFilePromises);
//       // // Send a response with the uploaded file information
//       // reply.send({
//       //   message: 'Các file đã được tải lên thành công.',
//       //   files: uploadResults,
//       // });
//     } else {
//       throw new BadRequestException('Request không hỗ trợ saveRequestFiles');
//     }
//   } catch (error) {
//     // Handle any errors during the file upload process
//     reply.status(500).send({ message: 'Have some error when process file.', error: error.message });
//   }
// }

// @ApiOperation({ summary: 'Get list of all uploaded files.' })
// @Get()
// @Roles(RolesEnum.company, RolesEnum.admin)
// async getAllFiles(@Res() reply: FastifyReply) {
//   const files = await this.fileService.findAll();
//   reply.send(files);
// }

// @ApiOperation({ summary: 'Get details of a specific file.' })
// @Get(':id')
// @Roles(RolesEnum.company, RolesEnum.admin)
// async getFileById(@Param('id') id: number, @Res() reply: FastifyReply) {
//   const file = await this.fileService.findOne(id);
//   if (!file) {
//     throw new NotFoundException('File not found.');
//   }
//   reply.send(file);
// }

// @ApiOperation({ summary: 'Update information of a file.' })
// @Put(':id')
// @Roles(RolesEnum.company, RolesEnum.admin)
// async updateFileInfo(@Param('id') id: number, @Req() request: FastifyRequest, @Res() reply: FastifyReply) {
//   const updateResult = await this.fileService.update(id, request.body);
//   if (!updateResult) {
//     throw new NotFoundException('File not found or update failed.');
//   }
//   reply.send(updateResult);
// }

// @ApiOperation({ summary: 'Delete a file.' })
// @Delete(':id')
// @Roles(RolesEnum.company, RolesEnum.admin)
// async deleteFile(@Param('id') id: number, @Res() reply: FastifyReply) {
//   const deleteResult = await this.fileService.delete(id);
//   if (!deleteResult) {
//     throw new NotFoundException('File not found or delete failed.');
//   }
//   reply.code(204).send();
// }
// }
