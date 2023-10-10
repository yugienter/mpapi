import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Equals, IsEmail, IsEnum, IsNotEmpty, IsString, Length, ValidateNested } from 'class-validator';

import { RolesEnum } from '@/app/models/user';
import { IsEqualTo } from '@/app/validators/is-equal-to.validator';

import { CreateCompanyRequest } from './company.dto';

export class SignInRequest {
  @ApiProperty({ example: 'test1@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'test1234' })
  @IsString()
  @IsNotEmpty()
  @Length(8, 20)
  password: string;

  @IsNotEmpty()
  @IsEnum(RolesEnum)
  role: RolesEnum;
}

export class ForgotPasswordRequest {
  @ApiProperty({ example: 'test1@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsEnum(RolesEnum)
  role: RolesEnum;
}

export class ResetPasswordRequest {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsEnum(RolesEnum)
  role: RolesEnum;

  @ApiProperty({ example: 'test1234' })
  @IsString()
  @Length(8, 20)
  @IsNotEmpty()
  new_password: string;

  @ApiProperty({ example: 'test1234' })
  @IsString()
  @Length(8, 20)
  @IsNotEmpty()
  @IsEqualTo('new_password', { message: 'Passwords do not match' })
  confirm_password: string;
}

export class VerifyEmailRequest {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsEnum(RolesEnum)
  role: RolesEnum;
}

export class SignupRequest {
  @ApiProperty({ example: 'test1@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'test1234' })
  @IsString()
  @Length(8, 20)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'test1234' })
  @IsString()
  @Length(8, 20)
  @IsNotEmpty()
  @Equals('password', { message: 'Passwords do not match' })
  password_confirmation: string;
}

class CompanyUserRequest extends SignupRequest {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UserAndCompanyRegisterRequest {
  @ApiProperty()
  @ValidateNested({ each: true })
  @Type(() => CompanyUserRequest)
  user: CompanyUserRequest;

  @ApiProperty()
  @ValidateNested({ each: true })
  @Type(() => CreateCompanyRequest)
  company: CreateCompanyRequest;
}

export class ManualCreateCompanyUserRequest {
  @ApiProperty({ example: 'test1@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @ValidateNested({ each: true })
  @Type(() => CreateCompanyRequest)
  company: CreateCompanyRequest;
}
