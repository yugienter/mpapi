import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

import { User, TypeOfBusinessEnum } from '@/app/models/user';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Company Ltd' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  position_of_user: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description_1: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description_2: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  area: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  area_other: boolean;

  @ApiProperty()
  @IsString()
  @IsIn([TypeOfBusinessEnum.MANUFACTURE, TypeOfBusinessEnum.DISTRIBUTION])
  @IsNotEmpty()
  type_of_business: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  commodity: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  willing_to: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  date_of_establishment: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  annual_revenue: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  annual_profit: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  number_of_employees: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  sell_of_shares: number;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  expected_price_of_shares: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  expected_price_of_shares_percent: number;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  issuance_raise_money: number;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  issuance_price_of_shares: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  issuance_price_of_shares_percent: number;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  business_collaboration: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  collaboration_detail: string;

  @ApiProperty({ type: User })
  users: User[];
}
