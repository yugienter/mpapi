import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Length, ValidateNested } from 'class-validator';

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
