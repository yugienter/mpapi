import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Validate } from 'class-validator';
import { User } from 'src/users/entities/user.entity';
import { IsExist } from 'src/utils/validators/is-exists.validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Company Ltd' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  position: string;

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
  areaOther: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  typeOfBusiness: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  commodity: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  willingTo: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  dateOfEstablishment: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  annualRevenue: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  annualProfit: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  numberOfEmployees: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  sellOfShares: number;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  expectedPriceOfShares: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  expectedPriceOfSharesPercent: number;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  issuanceRaiseMoney: number;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  issuancePriceOfShares: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  issuancePriceOfSharesPercent: number;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  businessCollaboration: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  collaborationDetail: string;

  @ApiProperty({ type: User })
  @Validate(IsExist, ['User', 'email'], {
    message: 'emailNotExists',
  })
  user: User;
}
