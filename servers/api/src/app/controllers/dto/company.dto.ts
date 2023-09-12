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

export class UpdateCompanyInfoDto {
  @ApiProperty({ example: 'Company Ltd', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  position_of_user?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description_1?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description_2?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  area?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  area_other?: boolean;

  @ApiProperty({ example: 'Manufacturing', required: false })
  @IsString()
  @IsIn(Object.values(TypeOfBusinessEnum))
  @IsOptional()
  type_of_business?: TypeOfBusinessEnum;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  commodity?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  willing_to?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  date_of_establishment?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  annual_revenue?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  annual_profit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  number_of_employees?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sell_of_shares?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  expected_price_of_shares?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  expected_price_of_shares_percent?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  issuance_raise_money?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  issuance_price_of_shares?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  issuance_price_of_shares_percent?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  business_collaboration?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  collaboration_detail?: string;

  @ApiProperty({ type: User, required: false })
  @IsOptional()
  users?: User[];
}
