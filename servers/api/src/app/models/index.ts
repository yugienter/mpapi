import { CompaniesUsers } from '@/app/models/companies-users';
import { Company } from '@/app/models/company';
import { EmailVerificationToken } from '@/app/models/email_verification_tokens';
import { UploadedFile } from '@/app/models/uploaded-file';
import { User } from '@/app/models/user';
import { UserProfile } from '@/app/models/user-profile';

export const ALL_MODELS = [User, UserProfile, Company, CompaniesUsers, EmailVerificationToken, UploadedFile];
