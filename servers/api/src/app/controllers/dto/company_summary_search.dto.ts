import { IsArray, IsOptional, IsString, Validate } from 'class-validator';

import { TypeOfBusinessEnum } from '@/app/models/company_information';
import { AnnualRevenueEnum, NumberOfEmployeesEnum, YearsEnum } from '@/app/models/company_summaries';
import { LanguageEnum } from '@/app/models/enum';

import { IsEnumKey } from './company_summary.dto';

export class SearchSummaryDto {
  @IsArray()
  @IsOptional()
  @Validate(IsEnumKey, [TypeOfBusinessEnum], { each: true })
  type_of_business: string[];

  @IsArray()
  @IsOptional()
  @Validate(IsEnumKey, [YearsEnum], { each: true })
  years: string[];

  @IsArray()
  @IsOptional()
  country: string[];

  @IsArray()
  @IsOptional()
  area: string[];

  @IsArray()
  @IsOptional()
  @Validate(IsEnumKey, [NumberOfEmployeesEnum], { each: true })
  number_of_employees: string[];

  @IsArray()
  @IsOptional()
  @Validate(IsEnumKey, [AnnualRevenueEnum], { each: true })
  annual_revenue: string[];

  @IsString()
  @IsOptional()
  keyword: string;

  constructor(partial: Partial<SearchSummaryDto>) {
    Object.assign(this, partial);
  }
}

export class CompanySummaryListingDto extends SearchSummaryDto {
  @IsString()
  @IsOptional()
  language?: LanguageEnum;

  constructor(partial: Partial<CompanySummaryListingDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
