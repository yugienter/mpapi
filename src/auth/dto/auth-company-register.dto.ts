import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';
import { CreateCompanyDto } from 'src/companies/dto/create-company.dto';
import { CreateCompanyUserDto } from 'src/users/dto/create-user-company.dto';

export class AuthCompanyRegisterDto {
  @ApiProperty()
  @IsObject()
  @IsNotEmpty()
  user: CreateCompanyUserDto;

  @ApiProperty()
  @IsObject()
  @IsNotEmpty()
  company: CreateCompanyDto;
}
