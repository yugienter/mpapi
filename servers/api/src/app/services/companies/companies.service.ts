import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import _ from 'lodash';
import { EntityManager, Repository } from 'typeorm';

import { CompanyInformationDto, FinancialDataDto } from '@/app/controllers/dto/company.dto';
import { CompanyDetailResponse, IFinancialData } from '@/app/controllers/viewmodels/company.response';
import { Company, StatusOfInformation } from '@/app/models/company';
import { CompanyFinancialData } from '@/app/models/company_financial_data';
import { CompanyInformation } from '@/app/models/company_information';
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
    @InjectEntityManager() private readonly _entityManager: EntityManager,
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
        id: savedCompany.id,
        files: updateFile,
        financial_data: companyInfoDto.financial_data,
      });

      return result;
    } catch (error) {
      this.logger.error(`[createCompany] failed for userId ${userId}`, error.stack);
      throw new Error(`[createCompany] error : ${error.message}`);
    }
  }

  async updateCompanyInfo(companyId: number, companyInfoDto: CompanyInformationDto, userId: string): Promise<any> {
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
        id: savedCompany.id,
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

      const companyInfo = await this.companyInformationRepository
        .createQueryBuilder('companyInfo')
        .leftJoinAndSelect('companyInfo.files', 'file')
        .leftJoinAndSelect('companyInfo.financial_data', 'financialData')
        .where('companyInfo.company_id = :companyId', { companyId })
        .andWhere('file.is_deleted = :isDeleted', { isDeleted: false })
        .getOne();

      if (!companyInfo) {
        this.logger.debug(`[getCompanyInfo]: UserId: ${userId} | Company Info not found - CompanyId: ${companyId}`);
        throw new NotFoundException(`[getCompanyInfo]: Company information not found for company ID: ${companyId}`);
      }

      const result = new CompanyDetailResponse({
        ...company,
        ...companyInfo,
        id: companyId,
      });

      return result;
    } catch (error) {
      this.logger.error(`[getCompanyInfo] failed for get company info of userId ${userId}`, error.stack);
      throw new Error(`[getCompanyInfo] error : ${error}`);
    }
  }
}
