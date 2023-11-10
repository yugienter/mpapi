import { IsNotEmpty, IsString } from 'class-validator';

export class UploadFileDto {
  readonly files: any;

  // @IsString()
  // @IsNotEmpty()
  // readonly purpose: string;
}
