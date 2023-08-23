import { ApiProperty } from '@nestjs/swagger';

export class UserUpdateRequest {
  @ApiProperty() name_sei: string;
  @ApiProperty() name_mei: string;
  @ApiProperty() kana_name_sei: string;
  @ApiProperty() kana_name_mei: string;
  @ApiProperty() birthday: string;
  @ApiProperty() gender: 'M' | 'F' | null;
}

export class EmailRequest {
  @ApiProperty() email: string;
}

export class PasswordChangingRequest {
  @ApiProperty() current_password: string;
  @ApiProperty() password: string;
  @ApiProperty() password_confirmation: string;
}
