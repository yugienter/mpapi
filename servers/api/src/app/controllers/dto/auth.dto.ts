import { ApiProperty } from '@nestjs/swagger';
import { CreateCompanyUserDto } from './user.dto';
import { CreateCompanyDto } from './company.dto';

export class SignInRequest {
  @ApiProperty() email: string;
  @ApiProperty() password: string;
}

export class SignupRequest {
  @ApiProperty() email: string;
  @ApiProperty() password: string;
  @ApiProperty() password_confirmation: string;
}

export class UserAndCompanyRegisterDto {
  @ApiProperty() user: CreateCompanyUserDto;
  @ApiProperty() company: CreateCompanyDto;
}
