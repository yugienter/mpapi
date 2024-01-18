import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CompanyInformationDto, FinancialDataDto } from '@/app/controllers/dto/company.dto';
import { CompanyDetailResponse, ICompanyInfoWithUserResponse } from '@/app/controllers/viewmodels/company.response';
import { UserInfo } from '@/app/controllers/viewmodels/user.response';
import { Company, StatusOfInformation } from '@/app/models/company';
import { CompanyFinancialData } from '@/app/models/company_financial_data';
import { CompanyInformation } from '@/app/models/company_information';
import { CompanySummary, SummaryStatus } from '@/app/models/company_summaries';
import { FileAttachments } from '@/app/models/file_attachments';
import { User } from '@/app/models/user';
import { Service } from '@/app/utils/decorators';

type SimplifiedCompany = Omit<Company, 'user'>;
type SimplifiedCompanyInformation = Omit<CompanyInformation, 'company' | 'files' | 'financial_data'>;

export interface CompanyDetail extends SimplifiedCompany, SimplifiedCompanyInformation {
  files: Partial<FileAttachments>[];
  financial_data: Partial<CompanyFinancialData>[];
}

@Service()
@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    @InjectRepository(Company) private companiesRepository: Repository<Company>,
    @InjectRepository(CompanyInformation) private companyInformationRepository: Repository<CompanyInformation>,
    @InjectRepository(CompanyFinancialData) private financialDataRepository: Repository<CompanyFinancialData>,
    @InjectRepository(FileAttachments) private filesRepository: Repository<FileAttachments>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(CompanySummary) private companySummaryRepository: Repository<CompanySummary>,
  ) {}

  private async handleFinancialData(
    companyInfo: CompanyInformation,
    financialDataDto: FinancialDataDto[],
    mode: 'add' | 'edit' = 'edit',
  ): Promise<void> {
    for (const data of financialDataDto) {
      try {
        let financialData;
        if (mode === 'edit') {
          financialData = await this.financialDataRepository.findOne({
            where: { company_information: { id: companyInfo.id }, year: data.year },
          });
        }

        if (!financialData) {
          financialData = this.financialDataRepository.create({ company_information: companyInfo });
        }
        Object.assign(financialData, data);
        await this.financialDataRepository.save(financialData);
      } catch (error) {
        this.logger.error(
          `[handleFinancialData][${mode}] Error handling financial data: ${data.year}: ${error.message}`,
        );
      }
    }
  }

  private async handleFileAttachments(
    companyInfoId: number,
    fileIds: number[],
    userId: string,
  ): Promise<{ id: number; name: string; path: string }[]> {
    try {
      const existingFiles = await this.filesRepository.find({ where: { company_information: { id: companyInfoId } } });

      const updatedFiles: { id: number; name: string; path: string }[] = [];

      const filesToRemove = existingFiles.filter((file) => !fileIds.includes(file.id));
      const filesToAdd = fileIds.filter((id) => !existingFiles.some((file) => file.id === id));

      for (const file of filesToRemove) {
        file.is_deleted = true;
        file.deleted_at = new Date();
        await this.filesRepository.save(file);
      }

      for (const fileId of filesToAdd) {
        const file = await this.filesRepository.findOne({
          where: { id: fileId, is_deleted: false },
          relations: ['user', 'company_information'],
        });

        if (!file || file.user.id !== userId || file.company_information) {
          continue;
        }

        file.company_information = { id: companyInfoId } as CompanyInformation;
        await this.filesRepository.save(file);

        updatedFiles.push({ id: file.id, name: file.name, path: file.path });
      }

      existingFiles.forEach((file) => {
        if (!file.is_deleted && !filesToRemove.some((f) => f.id === file.id)) {
          updatedFiles.push({ id: file.id, name: file.name, path: file.path });
        }
      });

      return updatedFiles;
    } catch (error) {
      this.logger.error(`[handleFileAttachments] Error: ${error.message}`);
      throw new Error(`[handleFileAttachments] ${error.message}`);
    }
  }

  private async getCompanyInformation(companyId: number): Promise<CompanyInformation> {
    const companyInfo = await this.companyInformationRepository
      .createQueryBuilder('companyInfo')
      .leftJoinAndSelect('companyInfo.financial_data', 'financialData')
      .where('companyInfo.company_id = :companyId', { companyId })
      .getOne();

    if (!companyInfo) {
      this.logger.debug(`[getCompanyInfo]: Company Info not found - CompanyId: ${companyId}`);
      throw new NotFoundException(`[getCompanyInfo]: Company information not found for company ID: ${companyId}`);
    }

    const files = await this.filesRepository
      .createQueryBuilder('file')
      .where('file.company_information_id = :companyInfoId', { companyInfoId: companyInfo.id })
      .andWhere('file.is_deleted = :isDeleted', { isDeleted: false })
      .getMany();

    return { ...companyInfo, files };
  }

  async createCompanyInfo(companyInfoDto: CompanyInformationDto, userId: string): Promise<CompanyDetailResponse> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const company = new Company();
      Object.assign(company, companyInfoDto);
      company.user = user;
      const savedCompany = await this.companiesRepository.save(company);

      const companyInfo = new CompanyInformation();
      Object.assign(companyInfo, companyInfoDto);
      companyInfo.company = savedCompany;

      await this.companyInformationRepository.save(companyInfo);

      let updateFile;
      if (companyInfoDto.files) {
        updateFile = await this.handleFileAttachments(companyInfo.id, companyInfoDto.files, userId);
      }

      if (companyInfoDto.financial_data && companyInfoDto.financial_data.length > 0) {
        await this.handleFinancialData(companyInfo, companyInfoDto.financial_data, 'add');
      }

      const result = new CompanyDetailResponse({
        ...savedCompany,
        ...companyInfo,
        companyId: savedCompany.id,
        companyInformationId: companyInfo.id,
        files: updateFile,
        financial_data: companyInfoDto.financial_data,
      });

      return result;
    } catch (error) {
      this.logger.error(`[createCompany] failed for userId ${userId}`, error.stack);
      throw new Error(`[createCompany] error : ${error.message}`);
    }
  }

  async updateCompanyInfo(
    companyId: number,
    companyInfoDto: CompanyInformationDto,
    userId: string,
  ): Promise<CompanyDetailResponse> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }
      const company = await this.companiesRepository.findOne({ where: { id: companyId, user: { id: userId } } });
      if (!company) {
        this.logger.error(`[updateCompanyInfo] Company of user ${userId} not found with ID: ${companyId}`);
        throw new NotFoundException(`[updateCompanyInfo] Company of user ${userId} not found with ID: ${companyId}`);
      }

      const companyInfo = await this.companyInformationRepository.findOne({ where: { company: { id: companyId } } });

      if (!companyInfo) {
        this.logger.error(`[updateCompanyInfo] CompanyInfo of user ${userId} not found with ID: ${companyId}`);
        throw new NotFoundException(
          `[updateCompanyInfo] CompanyInfo of user ${userId} not found with ID: ${companyId}`,
        );
      }

      if (
        [
          StatusOfInformation.PROCESSING, // Process then user can not action
          StatusOfInformation.PROCESSING, // Processed then user can not action
          StatusOfInformation.DRAFT_FROM_ADMIN, // from admin, so user can not edit in this case
        ].includes(companyInfo.status)
      ) {
        this.logger.error('[updateCompanyInfo] : Invalid status');
        throw Error('Invalid status of Information');
      }

      Object.assign(company, companyInfoDto);
      const savedCompany = await this.companiesRepository.save(company);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { files, financial_data, ...companyInfoData } = companyInfoDto;
      Object.assign(companyInfo, companyInfoData);
      await this.companyInformationRepository.save(companyInfo);

      let updateFile;
      if (companyInfoDto.files) {
        updateFile = await this.handleFileAttachments(companyInfo.id, companyInfoDto.files, userId);
      }

      if (companyInfoDto.financial_data && companyInfoDto.financial_data.length > 0) {
        await this.handleFinancialData(companyInfo, companyInfoDto.financial_data);
      }

      const result = new CompanyDetailResponse({
        ...savedCompany,
        ...companyInfo,
        companyId: savedCompany.id,
        companyInformationId: companyInfo.id,
        files: updateFile,
        financial_data: companyInfoDto.financial_data,
      });

      return result;
    } catch (error) {
      this.logger.error(`[createCompany] failed for userId ${userId}`, error.stack);
      throw new Error(`[createCompany] error : ${error.message}`);
    }
  }

  async getCompaniesOfUser(userId: string): Promise<Company[]> {
    try {
      return await this.companiesRepository.find({
        select: ['id', 'name', 'created_at', 'updated_at'],
        where: { user: { id: userId } },
        order: { created_at: 'ASC' },
      });
    } catch (error) {
      this.logger.error(`[getCompaniesOfUser] failed for get company list of userId ${userId}`, error.stack);
      throw new Error(`[getCompaniesOfUser] error : ${error}`);
    }
  }

  async getCompanyInfo(companyId: number, userId: string): Promise<CompanyDetailResponse> {
    try {
      const company = await this.companiesRepository.findOne({
        where: { id: companyId, user: { id: userId } },
        relations: ['user'],
      });

      if (!company) {
        this.logger.debug(`[getCompanyInfo]: UserId: ${userId} | Company not found - CompanyId: ${companyId}`);
        throw new NotFoundException(`[getCompanyInfo]: Company with ID ${companyId} not found`);
      }

      if (company.user.id !== userId) {
        this.logger.debug(`[getCompanyInfo]: UserId: ${userId} | Not have permission - CompanyId: ${companyId}`);
        throw new ForbiddenException('You do not have permission to access this company information');
      }

      const companyInfo = await this.getCompanyInformation(companyId);

      const result = new CompanyDetailResponse({
        ...company,
        ...companyInfo,
        companyId: companyId,
        companyInformationId: companyInfo.id,
      });

      return result;
    } catch (error) {
      this.logger.error(`[getCompanyInfo] failed for get company info of userId ${userId}`, error.stack);
      throw new Error(`[getCompanyInfo] error : ${error}`);
    }
  }

  async getCompanyInfoForAdmin(companyId: number): Promise<ICompanyInfoWithUserResponse> {
    try {
      const company = await this.companiesRepository.findOne({ where: { id: companyId }, relations: ['user'] });
      if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found`);
      }

      const companyInfo = await this.getCompanyInformation(companyId);

      const latestSummary = await this.companySummaryRepository
        .createQueryBuilder('summary')
        .where('summary.company_information_id = :companyInfoId', { companyInfoId: companyInfo.id })
        .andWhere('summary.status = :status', { status: SummaryStatus.POSTED })
        .orderBy('summary.version', 'DESC')
        .getOne();

      const summaryPostedId = latestSummary ? latestSummary.id : null;

      const companyResult = new CompanyDetailResponse({
        ...company,
        ...companyInfo,
        companyId: companyId,
        companyInformationId: companyInfo.id,
      });

      const user = new UserInfo(company.user);

      return { user, company: companyResult, summaryPostedId };
    } catch (error) {
      this.logger.error(`[getCompanyInfoForAdmin] failed for companyId ${companyId}`, error.stack);
      throw new Error(`[getCompanyInfoForAdmin] error : ${error.message}`);
    }
  }
}
