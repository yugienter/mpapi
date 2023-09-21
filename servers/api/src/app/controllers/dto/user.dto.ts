import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, Length } from 'class-validator';

export class UserUpdateRequest {
  @ApiProperty()
  @IsString()
  @Length(1, 50)
  name_sei: string;

  @ApiProperty()
  @IsString()
  @Length(1, 50)
  name_mei: string;

  @ApiProperty()
  @IsString()
  @Length(1, 50)
  kana_name_sei: string;

  @ApiProperty()
  @IsString()
  @Length(1, 50)
  kana_name_mei: string;

  @ApiProperty()
  @IsString()
  @Length(8, 10) // Assuming YYYY-MM-DD format
  birthday: string;

  @ApiProperty()
  @IsEnum(['M', 'F'])
  gender: 'M' | 'F' | null;
}
