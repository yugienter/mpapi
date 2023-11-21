import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  registerDecorator,
  ValidateIf,
  ValidateNested,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { StatusOfInformation } from '@/app/models/company';
import { TypeOfBusinessEnum } from '@/app/models/company_information';

@ValidatorConstraint({ async: true })
class IsOneOfThreeGroupsConstraint implements ValidatorConstraintInterface {
  validate(value: CompanyInformationDto, args: ValidationArguments) {
    const object = args.object as CompanyInformationDto;

    const group1HasData =
      object.transaction_sell_shares_percentage != null || object.transaction_sell_shares_amount != null;
    const group2HasData =
      object.transaction_issue_shares_percentage != null || object.transaction_issue_shares_amount != null;
    const group3HasData = object.transaction_other_details != null;

    const group1Valid =
      !group1HasData || (object.transaction_sell_shares_percentage > 0 && object.transaction_sell_shares_amount > 0);
    const group2Valid =
      !group2HasData || (object.transaction_issue_shares_percentage > 0 && object.transaction_issue_shares_amount > 0);
    const group3Valid = !group3HasData || object.transaction_other_details?.trim().length > 0;

    const atLeastOneGroupHasData = group1HasData || group2HasData || group3HasData;

    return atLeastOneGroupHasData && group1Valid && group2Valid && group3Valid;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(args: ValidationArguments) {
    return 'At least one of the three transaction groups must be valid if status is SUBMITTED.';
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

@ValidatorConstraint({ async: true })
class CombinedFinancialDataConstraint implements ValidatorConstraintInterface {
  validate(financialData: FinancialDataDto[], args: ValidationArguments) {
    const object = args.object as CompanyInformationDto;

    if (!financialData || financialData.length === 0) {
      // Case no data financial
      return object.status !== StatusOfInformation.SUBMITTED;
    }

    const currentYear = new Date().getFullYear();
    const requiredYears = [currentYear, currentYear - 1, currentYear - 2];
    const validYears = new Set(requiredYears);

    // Check no more 3 year and limit 3 item
    if (financialData.length > 3 || !financialData.every((data) => validYears.has(data.year))) {
      return false;
    }

    // Check information need fully field when status is SUBMITTED
    if (object.status === StatusOfInformation.SUBMITTED) {
      return (
        financialData.every(
          (data) =>
            data.year != null &&
            data.sales != null &&
            data.profit != null &&
            data.EBITDA != null &&
            data.net_asset != null &&
            data.net_debt != null,
        ) && requiredYears.every((year) => financialData.some((data) => data.year === year))
      );
    }

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(args: ValidationArguments) {
    return 'Financial data must be complete, from the last three years, and not exceed three entries.';
  }
}

function ValidateCombinedFinancialData(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: CombinedFinancialDataConstraint,
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

  @ValidateIf((o) => o.status === StatusOfInformation.SUBMITTED)
  @IsNotEmpty()
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

  @ValidateIf((o) => o.status === StatusOfInformation.SUBMITTED)
  @IsNotEmpty()
  @IsString()
  general_shareholder_structure?: string;

  @ValidateIf((o) => o.status === StatusOfInformation.SUBMITTED)
  @IsNotEmpty()
  @IsString()
  general_management_structure?: string;

  @ValidateIf((o) => o.status === StatusOfInformation.SUBMITTED)
  @IsNotEmpty()
  @IsInt()
  @Min(1900)
  general_year_of_establishment: number;

  @ValidateIf((o) => o.status === StatusOfInformation.SUBMITTED)
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  general_headquarter?: string;

  @ValidateIf((o) => o.status === StatusOfInformation.SUBMITTED)
  @IsNotEmpty()
  @IsEnum(TypeOfBusinessEnum)
  general_business_type: TypeOfBusinessEnum;

  @ValidateIf((o) => o.status === StatusOfInformation.SUBMITTED)
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  general_business_location_country: string;

  @ValidateIf((o) => o.status === StatusOfInformation.SUBMITTED)
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  general_business_location_area: string;

  @ValidateIf((o) => o.status === StatusOfInformation.SUBMITTED)
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  general_number_of_employees: number;

  @ValidateIf((o) => o.status === StatusOfInformation.SUBMITTED)
  @IsNotEmpty()
  @IsString()
  business_overview?: string;

  @ValidateIf((o) => o.status === StatusOfInformation.SUBMITTED)
  @IsNotEmpty()
  @IsString()
  business_main_products_services?: string;

  @ValidateIf((o) => o.status === StatusOfInformation.SUBMITTED)
  @IsNotEmpty()
  @IsString()
  business_major_clients?: string;

  @ValidateIf((o) => o.status === StatusOfInformation.SUBMITTED)
  @IsNotEmpty()
  @IsString()
  business_major_suppliers?: string;

  @ValidateIf((o) => o.status === StatusOfInformation.SUBMITTED)
  @IsNotEmpty()
  @IsString()
  business_future_growth_projection?: string;

  // Financial Data

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => FinancialDataDto)
  @ValidateCombinedFinancialData({
    message: 'Financial data must be complete, from the last three years, and not exceed three entries.',
  })
  financial_data: FinancialDataDto[];

  @ValidateIf((o) => o.status === StatusOfInformation.SUBMITTED)
  @IsNotEmpty()
  @IsNumber()
  financial_current_valuation: number;

  // End Financial Data

  // Transaction Data

  @ValidateIf((o) => o.transaction_sell_shares_percentage != null)
  @IsInt()
  @Min(1)
  @Max(100)
  transaction_sell_shares_percentage: number;

  @ValidateIf((o) => o.transaction_sell_shares_amount != null)
  @IsNumber()
  @Min(1)
  transaction_sell_shares_amount: number;

  @ValidateIf((o) => o.transaction_issue_shares_percentage != null)
  @IsInt()
  @Min(1)
  @Max(100)
  transaction_issue_shares_percentage: number;

  @ValidateIf((o) => o.transaction_issue_shares_amount != null)
  @IsNumber()
  @Min(1)
  transaction_issue_shares_amount: number;

  @ValidateIf((o) => o.transaction_other_details != null)
  @IsString()
  transaction_other_details?: string;

  @IsOneOfThreeGroups()
  _oneOfThreeGroups: boolean;

  // End Transaction Data

  @ValidateIf((o) => o.status === StatusOfInformation.SUBMITTED)
  @IsNotEmpty()
  @IsString()
  reason_deal_reason?: string;

  @ValidateIf((o) => o.status === StatusOfInformation.SUBMITTED)
  @IsNotEmpty()
  @IsString()
  reason_deal_timeline?: string;

  @IsEnum(StatusOfInformation)
  @IsNotEmpty()
  status: StatusOfInformation;

  @IsArray()
  @IsInt({ each: true })
  files?: number[];
}
