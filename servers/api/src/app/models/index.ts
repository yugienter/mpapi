import { Company } from '@/app/models/company';
import { CompanyFinancialData } from '@/app/models/company_financial_data';
import { CompanyInformation } from '@/app/models/company_information';
import { CompanySummary } from '@/app/models/company_summaries';
import { CompanySummaryTranslation } from '@/app/models/company_summaries_translations';
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
  CompanySummary,
  CompanySummaryTranslation,
  EmailVerificationToken,
  FileAttachments,
];
