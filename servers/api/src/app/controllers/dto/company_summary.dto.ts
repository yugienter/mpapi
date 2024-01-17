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

export class CompanySummaryDto {
  @ValidateIf((o) => o.status === SummaryStatus.REQUEST || o.status === SummaryStatus.SUBMITTED)
  @IsString()
  country: string;

  @ValidateIf((o) => o.status === SummaryStatus.REQUEST || o.status === SummaryStatus.SUBMITTED)
  @IsString()
  area: string;

  @ValidateIf((o) => o.status === SummaryStatus.REQUEST || o.status === SummaryStatus.SUBMITTED)
  @IsString()
  title: string;

  @ValidateIf((o) => o.status === SummaryStatus.REQUEST || o.status === SummaryStatus.SUBMITTED)
  @IsString()
  content: string;

  @ValidateIf((o) => o.status === SummaryStatus.REQUEST || o.status === SummaryStatus.SUBMITTED)
  @IsEnum(TypeOfBusinessEnum)
  type_of_business: TypeOfBusinessEnum;

  @ValidateIf((o) => o.status === SummaryStatus.REQUEST || o.status === SummaryStatus.SUBMITTED)
  @IsEnum(YearsEnum)
  years: YearsEnum;

  @ValidateIf((o) => o.status === SummaryStatus.REQUEST || o.status === SummaryStatus.SUBMITTED)
  @IsEnum(NumberOfEmployeesEnum)
  number_of_employees: NumberOfEmployeesEnum;

  @ValidateIf((o) => o.status === SummaryStatus.REQUEST || o.status === SummaryStatus.SUBMITTED)
  @IsEnum(AnnualRevenueEnum)
  annual_revenue: AnnualRevenueEnum;

  @IsNotEmpty()
  @IsAllowedStatus({ message: 'Invalid status value' })
  status: SummaryStatus;
}

export class AddSummaryToMasterDto {
  @IsBoolean()
  is_public: boolean;
}
