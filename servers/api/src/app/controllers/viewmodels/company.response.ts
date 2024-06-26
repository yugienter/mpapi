import _ from 'lodash';

import { AdminCompanyInformationNote } from '@/app/models/admin_company_information_notes';
import { User } from '@/app/models/user';

import { UserInfo } from './user.response';

export interface ICompanyDetailResponse {
  companyId: number;
  companyInformationId: number;
  name: string;
  contact_person_name: string;
  contact_person_email: string;
  position: string;
  phone_number: string;
  website: string;
  general_shareholder_structure: string;
  general_management_structure: string;
  general_year_of_establishment: number; // Year should be a number
  general_headquarter: string;
  general_business_type: string;
  general_business_location_country: string;
  general_business_location_area: string;
  general_number_of_employees?: number; // Number of employees should be a number
  business_overview: string;
  business_main_products_services: string;
  business_major_clients: string;
  business_major_suppliers: string;
  business_future_growth_projection: string;
  financial_current_valuation: number; // Valuation should be a number
  transaction_sell_shares_percentage: number; // Percentage should be a number
  transaction_sell_shares_amount: number; // Amount should be a number
  transaction_issue_shares_percentage: number; // Percentage should be a number
  transaction_issue_shares_amount: number; // Amount should be a number
  transaction_other_details: string;
  reason_deal_reason: string;
  reason_deal_timeline: string;
  status: string;
  files: IFileAttachment[];
  financial_data: IFinancialData[];
  created_at: Date; // Assuming you want to keep the Date type
  updated_at: Date;
  admin: User;
}

export interface IFinancialData {
  year: number;
  sales?: number;
  profit?: number;
  EBITDA?: number;
  net_asset?: number;
  net_debt?: number;
}
export interface IFileAttachment {
  id: number;
  name: string;
  path: string;
}

export class CompanyDetailResponse {
  companyId: number;
  companyInformationId: number;
  name: string;
  contact_person_name: string;
  contact_person_email: string;
  position: string;
  phone_number: string;
  website: string;
  general_shareholder_structure: string;
  general_management_structure: string;
  general_year_of_establishment: number; // Year should be a number
  general_headquarter: string;
  general_business_type: string;
  general_business_location_country: string;
  general_business_location_area: string;
  general_number_of_employees: number; // Number of employees should be a number
  business_overview: string;
  business_main_products_services: string;
  business_major_clients: string;
  business_major_suppliers: string;
  business_future_growth_projection: string;
  financial_current_valuation: number; // Valuation should be a number
  transaction_sell_shares_percentage: number; // Percentage should be a number
  transaction_sell_shares_amount: number; // Amount should be a number
  transaction_issue_shares_percentage: number; // Percentage should be a number
  transaction_issue_shares_amount: number; // Amount should be a number
  transaction_other_details: string;
  reason_deal_reason: string;
  reason_deal_timeline: string;
  status: string;
  files: IFileAttachment[];
  financial_data: IFinancialData[];
  created_at: Date; // Assuming you want to keep the Date type
  updated_at: Date;
  created_by_admin: boolean;

  constructor(input: ICompanyDetailResponse) {
    this.companyId = input.companyId;
    this.companyInformationId = input.companyInformationId;
    this.name = input.name;
    this.contact_person_name = input.contact_person_name;
    this.contact_person_email = input.contact_person_email;
    this.position = input.position;
    this.phone_number = input.phone_number;
    this.website = input.website;
    this.general_shareholder_structure = input.general_shareholder_structure;
    this.general_management_structure = input.general_management_structure;
    this.general_year_of_establishment = input.general_year_of_establishment;
    this.general_headquarter = input.general_headquarter;
    this.general_business_type = input.general_business_type;
    this.general_business_location_country = input.general_business_location_country;
    this.general_business_location_area = input.general_business_location_area;
    this.general_number_of_employees = input.general_number_of_employees || 0;
    this.business_overview = input.business_overview;
    this.business_main_products_services = input.business_main_products_services;
    this.business_major_clients = input.business_major_clients;
    this.business_major_suppliers = input.business_major_suppliers;
    this.business_future_growth_projection = input.business_future_growth_projection;
    this.financial_current_valuation = input.financial_current_valuation;
    this.transaction_sell_shares_percentage = input.transaction_sell_shares_percentage;
    this.transaction_sell_shares_amount = input.transaction_sell_shares_amount;
    this.transaction_issue_shares_percentage = input.transaction_issue_shares_percentage;
    this.transaction_issue_shares_amount = input.transaction_issue_shares_amount;
    this.transaction_other_details = input.transaction_other_details;
    this.reason_deal_reason = input.reason_deal_reason;
    this.reason_deal_timeline = input.reason_deal_timeline;
    this.status = input.status;
    this.files = _.map(input.files, (file) => ({
      id: file.id,
      name: file.name,
      path: file.path,
    }));
    this.financial_data = _.map(input.financial_data, (data) => ({
      year: data.year,
      sales: data.sales,
      profit: data.profit,
      EBITDA: data.EBITDA,
      net_asset: data.net_asset,
      net_debt: data.net_debt,
    }));
    this.created_at = input.created_at;
    this.updated_at = input.updated_at;
    this.created_by_admin = input.admin ? true : false;
  }
}

export interface ICompanyInfoWithUserResponse {
  user: UserInfo | null;
  company: CompanyDetailResponse;
  summaryPostedId: number | null;
}

export class AdminNoteResponse {
  static response(adminNote: AdminCompanyInformationNote): IAdminNoteResponse {
    return {
      id: adminNote.id,
      note: adminNote.note,
      created_at: adminNote.created_at,
      updated_at: adminNote.updated_at,
      companyInformationId: adminNote.companyInformation?.id,
    };
  }
}

export interface IAdminNoteResponse {
  id: number;
  note: string;
  created_at: Date;
  updated_at: Date;
  companyInformationId: number;
}
