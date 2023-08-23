import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

import { TypeOfBusinessEnum } from '@/app/models/company';
import { User } from '@/app/models/user';

export class CreateCompanyRequest {
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

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsNotEmpty()
  area_other: boolean;

  @ApiProperty({ example: 'Manufacturing' })
  @IsString()
  @IsIn([Object.values(TypeOfBusinessEnum)])
  @IsNotEmpty()
  type_of_business: TypeOfBusinessEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  commodity: string;

  @ApiProperty({ example: true })
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
