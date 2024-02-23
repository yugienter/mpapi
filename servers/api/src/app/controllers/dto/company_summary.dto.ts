import { IsBoolean, IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

import { TypeOfBusinessEnum } from '@/app/models/company_information';
import { AnnualRevenueEnum, NumberOfEmployeesEnum, SummaryStatus, YearsEnum } from '@/app/models/company_summaries';

export function IsAllowedStatus(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAllowedStatus',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        validate(value: any, args: ValidationArguments) {
          return value !== SummaryStatus.POSTED;
        },
      },
    });
  };
}

export function IsEnumKey(enumObj: object, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isEnumKey',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [enumObj],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [enumObj] = args.constraints;
          return Object.keys(enumObj).includes(value);
        },
      },
    });
  };
}

export class CompanySummaryDto {
  @ValidateIf((o) => o.status === SummaryStatus.REQUEST || o.status === SummaryStatus.SUBMITTED || !!o.country)
  @IsNotEmpty()
  @IsString()
  country: string;

  @ValidateIf((o) => o.status === SummaryStatus.REQUEST || o.status === SummaryStatus.SUBMITTED || !!o.area)
  @IsNotEmpty()
  @IsString()
  area: string;

  @ValidateIf((o) => o.status === SummaryStatus.REQUEST || o.status === SummaryStatus.SUBMITTED || !!o.title)
  @IsNotEmpty()
  @IsString()
  title: string;

  @ValidateIf((o) => o.status === SummaryStatus.REQUEST || o.status === SummaryStatus.SUBMITTED || !!o.content)
  @IsNotEmpty()
  @IsString()
  content: string;

  @ValidateIf((o) => o.status === SummaryStatus.REQUEST || o.status === SummaryStatus.SUBMITTED || !!o.type_of_business)
  @IsNotEmpty()
  @IsEnumKey(TypeOfBusinessEnum)
  type_of_business: string;

  @ValidateIf((o) => o.status === SummaryStatus.REQUEST || o.status === SummaryStatus.SUBMITTED || !!o.years)
  @IsNotEmpty()
  @IsEnumKey(YearsEnum)
  years: string;

  @ValidateIf(
    (o) => o.status === SummaryStatus.REQUEST || o.status === SummaryStatus.SUBMITTED || !!o.number_of_employees,
  )
  @IsNotEmpty()
  @IsEnumKey(NumberOfEmployeesEnum)
  number_of_employees: string;

  @ValidateIf((o) => o.status === SummaryStatus.REQUEST || o.status === SummaryStatus.SUBMITTED || !!o.annual_revenue)
  @IsNotEmpty()
  @IsEnumKey(AnnualRevenueEnum)
  annual_revenue: string;

  @IsNotEmpty()
  @IsAllowedStatus({ message: 'Invalid status value' })
  status: SummaryStatus;
}

export class UpdateSummaryMasterDto {
  @IsNotEmpty()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsString()
  area: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsEnumKey(TypeOfBusinessEnum)
  type_of_business: string;

  @IsNotEmpty()
  @IsEnumKey(YearsEnum)
  years: string;

  @IsNotEmpty()
  @IsEnumKey(NumberOfEmployeesEnum)
  number_of_employees: string;

  @IsNotEmpty()
  @IsEnumKey(AnnualRevenueEnum)
  annual_revenue: string;

  @IsNotEmpty()
  @IsEnum(SummaryStatus)
  status: SummaryStatus.POSTED;
}

export class AddSummaryToMasterDto {
  @IsBoolean()
  is_public: boolean;
}
