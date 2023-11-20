import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  registerDecorator,
  ValidateNested,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { StatusOfInformation } from '@/app/models/company';
import { TypeOfBusinessEnum } from '@/app/models/company_information';
import { FileAttachments } from '@/app/models/file_attachments';

@ValidatorConstraint({ async: true })
class IsOneOfThreeGroupsConstraint implements ValidatorConstraintInterface {
  validate(value: CompanyInformationDto, args: ValidationArguments) {
    const object = args.object as CompanyInformationDto;

    const group1Filled =
      object.transaction_sell_shares_percentage != null && object.transaction_sell_shares_amount != null;
    const group2Filled =
      object.transaction_issue_shares_percentage != null && object.transaction_issue_shares_amount != null;
    const group3Filled = object.transaction_other_details != null;

    const groupsFilled = [group1Filled, group2Filled, group3Filled].filter((v) => v).length;

    return groupsFilled === 1;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(args: ValidationArguments) {
    return 'One of three option of Transaction Session is not empty : [Sell Shares - Issue Share - Other].';
  }
}

function IsOneOfThreeGroups(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsOneOfThreeGroupsConstraint,
    });
  };
}

export class FinancialDataDto {
  @IsInt()
  year: number;

  @IsOptional()
  @IsNumber()
  sales?: number;

  @IsOptional()
  @IsNumber()
  profit?: number;

  @IsOptional()
  @IsNumber()
  EBITDA?: number;

  @IsOptional()
  @IsNumber()
  net_asset?: number;

  @IsOptional()
  @IsNumber()
  net_debt?: number;
}

export class CompanyInformationDto {
  @IsString()
  @IsNotEmpty({ message: 'Company Name is not empty' })
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @IsOptional()
  @IsString()
  general_shareholder_structure?: string;

  @IsOptional()
  @IsString()
  general_management_structure?: string;

  @IsInt()
  @Min(1900)
  general_year_of_establishment: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  general_headquarter?: string;

  @IsEnum(TypeOfBusinessEnum)
  general_business_type: TypeOfBusinessEnum;

  @IsString()
  @MaxLength(50)
  general_business_location_country: string;

  @IsString()
  @MaxLength(50)
  general_business_location_area: string;

  @IsInt()
  @Min(0)
  general_number_of_employees: number;

  @IsOptional()
  @IsString()
  business_overview?: string;

  @IsOptional()
  @IsString()
  business_main_products_services?: string;

  @IsOptional()
  @IsString()
  business_major_clients?: string;

  @IsOptional()
  @IsString()
  business_major_suppliers?: string;

  @IsOptional()
  @IsString()
  business_future_growth_projection?: string;

  // Financial Data

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FinancialDataDto)
  financial_data: FinancialDataDto[];

  @IsNumber()
  financial_current_valuation: number;

  // End Financial Data

  // Transaction Data

  @IsInt()
  @Min(0)
  transaction_sell_shares_percentage: number;

  @IsNumber()
  transaction_sell_shares_amount: number;

  @IsInt()
  @Min(0)
  transaction_issue_shares_percentage: number;

  @IsNumber()
  transaction_issue_shares_amount: number;

  @IsOptional()
  @IsString()
  transaction_other_details?: string;

  @IsOneOfThreeGroups()
  _oneOfThreeGroups: boolean;

  // End Transaction Data

  @IsOptional()
  @IsString()
  reason_deal_reason?: string;

  @IsOptional()
  @IsString()
  reason_deal_timeline?: string;

  @IsEnum(StatusOfInformation)
  status: StatusOfInformation;

  @IsArray()
  @ArrayNotEmpty()
  files: FileAttachments[];
}
