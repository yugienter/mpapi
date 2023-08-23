import { ApiProperty } from '@nestjs/swagger';

import { CreateCompanyRequest } from './company.dto';

export class SignInRequest {
  @ApiProperty({ example: 'test1@example.com' }) email: string;
  @ApiProperty({ example: 'test1234' }) password: string;
}

export class SignupRequest {
  @ApiProperty({ example: 'test1@example.com' }) email: string;
  @ApiProperty({ example: 'test1234' }) password: string;
  @ApiProperty({ example: 'test1234' }) password_confirmation: string;
}

class CompanyUserRequest extends SignupRequest {
  @ApiProperty({ example: 'John' })
  name: string;
}

export class UserAndCompanyRegisterRequest {
  @ApiProperty() user: CompanyUserRequest;
  @ApiProperty() company: CreateCompanyRequest;
}
