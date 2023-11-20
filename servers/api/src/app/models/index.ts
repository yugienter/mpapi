import { Company } from '@/app/models/company';
import { CompanyFinancialData } from '@/app/models/company_financial_data';
import { CompanyInformation } from '@/app/models/company_information';
import { EmailVerificationToken } from '@/app/models/email_verification_tokens';
import { FileAttachments } from '@/app/models/file_attachments';
import { User } from '@/app/models/user';
import { UserProfile } from '@/app/models/user-profile';

export const ALL_MODELS = [
  User,
  UserProfile,
  Company,
  CompanyInformation,
  CompanyFinancialData,
  EmailVerificationToken,
  FileAttachments,
];
