import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

import { IsOptionalButNotEmpty } from '@/app/controllers/dto/custom';
import { TypeOfBusinessEnum } from '@/app/models/company';
import { User } from '@/app/models/user';

export class BaseCompanyDto {
  @ApiProperty({ example: 'Company Ltd' })
  @IsString()
  name?: string;

  @ApiProperty()
  @IsString()
  position_of_user?: string;

  @ApiProperty()
  @IsString()
  description_1?: string;

  @ApiProperty()
  @IsString()
  description_2?: string;

  @ApiProperty()
  @IsString()
  country?: string;

  @ApiProperty()
  @IsString()
  area?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  area_other?: boolean;

  @ApiProperty({ example: 'Manufacturing' })
  @IsIn(Object.values(TypeOfBusinessEnum))
  @IsString()
  type_of_business?: TypeOfBusinessEnum;

  @ApiProperty()
  @ValidateIf((o) => [TypeOfBusinessEnum.MANUFACTURING, TypeOfBusinessEnum.DISTRIBUTION].includes(o.type_of_business))
  @IsString()
  commodity?: string;

  @ApiProperty({ example: true })
  @ValidateIf((o) => [TypeOfBusinessEnum.MANUFACTURING, TypeOfBusinessEnum.DISTRIBUTION].includes(o.type_of_business))
  @IsBoolean()
  willing_to?: boolean;

  @ApiProperty()
  @IsString()
  date_of_establishment?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  annual_revenue?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  annual_profit?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  number_of_employees?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  sell_of_shares?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  expected_price_of_shares?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  expected_price_of_shares_percent?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  issuance_raise_money?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  issuance_price_of_shares?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  issuance_price_of_shares_percent?: number;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  business_collaboration?: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  collaboration_detail?: string;

  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  files?: number[];

  @ApiProperty({ type: User })
  users?: User[];
}

export class CreateCompanyRequest extends BaseCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  position_of_user: string;

  @IsString()
  @IsNotEmpty()
  description_1: string;

  @IsString()
  @IsNotEmpty()
  description_2: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  area: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsNotEmpty()
  area_other: boolean;

  @ApiProperty({ example: 'Manufacturing' })
  @IsIn(Object.values(TypeOfBusinessEnum))
  @IsString()
  @IsNotEmpty()
  type_of_business: TypeOfBusinessEnum;

  @ValidateIf((o) => [TypeOfBusinessEnum.MANUFACTURING, TypeOfBusinessEnum.DISTRIBUTION].includes(o.type_of_business))
  @IsString()
  @IsNotEmpty()
  commodity: string;

  @ApiProperty({ example: true })
  @ValidateIf((o) => [TypeOfBusinessEnum.MANUFACTURING, TypeOfBusinessEnum.DISTRIBUTION].includes(o.type_of_business))
  @IsBoolean()
  @IsNotEmpty()
  willing_to: boolean;

  @IsString()
  @IsNotEmpty()
  date_of_establishment: string;
}

export class UpdateCompanyInfoDto extends BaseCompanyDto {
  @IsString()
  @IsOptionalButNotEmpty()
  name?: string;

  @IsString()
  @IsOptionalButNotEmpty()
  position_of_user?: string;

  @IsString()
  @IsOptionalButNotEmpty()
  description_1?: string;

  @IsString()
  @IsOptionalButNotEmpty()
  description_2?: string;

  @IsString()
  @IsOptionalButNotEmpty()
  country?: string;

  @IsString()
  @IsOptionalButNotEmpty()
  area?: string;

  @IsBoolean()
  @IsOptionalButNotEmpty()
  area_other?: boolean;

  @IsIn(Object.values(TypeOfBusinessEnum))
  @IsString()
  @IsOptionalButNotEmpty()
  type_of_business?: TypeOfBusinessEnum;

  @ValidateIf((o) => [TypeOfBusinessEnum.MANUFACTURING, TypeOfBusinessEnum.DISTRIBUTION].includes(o.type_of_business))
  @IsString()
  @IsNotEmpty()
  commodity?: string;

  @ValidateIf((o) => [TypeOfBusinessEnum.MANUFACTURING, TypeOfBusinessEnum.DISTRIBUTION].includes(o.type_of_business))
  @IsBoolean()
  @IsNotEmpty()
  willing_to?: boolean;

  @IsString()
  @IsOptional()
  date_of_establishment?: string;

  @IsOptional()
  @IsNumber()
  annual_revenue?: number;

  @IsOptional()
  @IsNumber()
  annual_profit?: number;

  @IsNumber()
  @IsOptional()
  number_of_employees?: number;
}
