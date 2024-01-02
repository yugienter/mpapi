import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { CompanySummaryDto } from '@/app/controllers/dto/company_summary.dto';
import { CompanySummaryResponse } from '@/app/controllers/viewmodels/company_summary.response';
import { CompanyInformation } from '@/app/models/company_information';
import { CompanySummary, SummaryStatus } from '@/app/models/company_summaries';
import { ConfigProvider } from '@/app/providers/config.provider';
import { DataAccessProvider } from '@/app/providers/data-access.provider';
import { EmailProvider } from '@/app/providers/email.provider';
import { Service } from '@/app/utils/decorators';

@Service()
@Injectable()
export class CompanySummariesService {
  private readonly logger = new Logger(CompanySummariesService.name);

  constructor(
    private readonly emailProvider: EmailProvider,
    private readonly configProvider: ConfigProvider,
    private dataAccessProvider: DataAccessProvider,
    @InjectRepository(CompanyInformation) private companyInformationRepository: Repository<CompanyInformation>,
    @InjectRepository(CompanySummary) private companySummaryRepository: Repository<CompanySummary>,
  ) {}

  async getSummaryForAdmin(companyInformationId: number): Promise<CompanySummary | null> {
    try {
      const summary = await this.companySummaryRepository.findOne({
        where: { companyInformation: { id: companyInformationId } },
      });

      return summary;
    } catch (error) {
      this.logger.error(`[getSummaryForAdmin] Failed to get summary: ${error.message}`);
      throw new InternalServerErrorException('Failed to get summary');
    }
  }

  async getSummaryForUser(companyInformationId: number, userId: string): Promise<CompanySummaryResponse | null> {
    try {
      const summary = await this.companySummaryRepository.findOne({
        where: {
          companyInformation: { id: companyInformationId },
          status: Not(SummaryStatus.DRAFT_FROM_ADMIN),
        },
        relations: ['companyInformation', 'companyInformation.company', 'companyInformation.company.user'],
      });

      if (!summary) {
        return null;
      }

      if (summary.companyInformation.company.user.id !== userId) {
        this.logger.error(`[getSummary] User with Id: ${userId} does not have permission to access this summary`);
        throw new ForbiddenException('You do not have permission to access this summary');
      }

      return new CompanySummaryResponse(summary);
    } catch (error) {
      this.logger.error(`[getSummaryForUser] Failed to get summary: ${error.message}`);
      throw new InternalServerErrorException('Failed to get summary');
    }
  }

  private async sendSummaryRequestEmail(
    companyInformation: CompanyInformation,
    summary: CompanySummary,
  ): Promise<void> {
    const userEmail = companyInformation.company.user.email;
    const companyName = companyInformation.company.name;
    const adminEmail = this.configProvider.config.adminEmail;
    const baseUrl = this.configProvider.config.exchangeBaseUrl;
    const companyInfoId = companyInformation.id;

    const acceptLink = `${baseUrl}/company/${companyInfoId}?mode=view&tab=summary&action=approve-from-email`;
    const editLink = `${baseUrl}/company/${companyInfoId}?mode=edit&tab=summary`;

    try {
      const emailContext = {
        companyName,
        country: this.dataAccessProvider.getCountryNameByCode(summary.country),
        title: summary.title,
        typeOfBusiness: summary.type_of_business,
        content: summary.content,
        userEmail,
        acceptLink,
        editLink,
      };

      this.logger.log(`Send summary request for user with email: ${userEmail}`);
      await this.emailProvider.sendSummaryRequestEmail(
        'Review and Confirm Your Company Summary',
        userEmail,
        emailContext,
        'user',
      );

      this.logger.log(`Send summary request for user with admin email: ${adminEmail}`);
      await this.emailProvider.sendSummaryRequestEmail(
        'Review and Confirm Company Summary',
        adminEmail,
        emailContext,
        'admin',
      );
    } catch (error) {
      this.logger.error(error);
      this.logger.log(`[sendSummaryRequestEmail] Fail to send email for ${userEmail}`);
    }
  }

  private async sendSummarySubmitEmail(userEmail: string, companyName: string, summary: CompanySummary): Promise<void> {
    const adminEmail = this.configProvider.config.adminEmail;
    try {
      const emailContext = {
        companyName,
        country: this.dataAccessProvider.getCountryNameByCode(summary.country),
        title: summary.title,
        typeOfBusiness: summary.type_of_business,
        content: summary.content,
        userEmail,
      };

      this.logger.log(`Send summary submit email for user with email: ${userEmail}`);
      await this.emailProvider.sendSummaryUpdateNotification(
        'Summary Update Notification',
        userEmail,
        emailContext,
        'user',
      );

      this.logger.log(`Send summary submit email for user with admin email: ${adminEmail}`);
      await this.emailProvider.sendSummaryUpdateNotification(
        'Summary Update Notification',
        adminEmail,
        emailContext,
        'admin',
      );
    } catch (error) {
      this.logger.error(error);
      this.logger.log(`[sendSummarySubmitEmail] Fail to send email for ${userEmail}`);
    }
  }

  async createSummary(
    companyInformationId: number,
    createSummaryDto: CompanySummaryDto,
  ): Promise<CompanySummaryResponse> {
    try {
      const companyInformation = await this.companyInformationRepository.findOne({
        where: { id: companyInformationId },
        relations: ['company', 'company.user'],
      });
      if (!companyInformation) {
        this.logger.error(`[createSummary] CompanyInformation with ID ${companyInformationId} not found`);
        throw new NotFoundException(`CompanyInformation with ID ${companyInformationId} not found`);
      }

      // if have summary, can not create
      const exitSummary = await this.companySummaryRepository.findOne({
        where: { companyInformation: { id: companyInformationId } },
      });

      if (exitSummary) {
        this.logger.error(
          `[createSummary] Already exit another summary for CompanyInformation ID ${companyInformationId}`,
        );
        throw new NotFoundException(` Already exit another summary for CompanyInformation ID ${companyInformationId}`);
      }

      const summary = this.companySummaryRepository.create({
        ...createSummaryDto,
        companyInformation: companyInformation,
      });
      const summarySave = await this.companySummaryRepository.save(summary);

      if (createSummaryDto.status === SummaryStatus.REQUEST) {
        await this.sendSummaryRequestEmail(companyInformation, summarySave);
      }

      return new CompanySummaryResponse(summarySave);
    } catch (error) {
      this.logger.error(`[createSummary] Failed to create summary: ${error.message}`);
      throw new InternalServerErrorException('Failed to create summary');
    }
  }

  async updateSummary(
    companyInformationId: number,
    summaryId: number,
    updateSummaryDto: CompanySummaryDto,
  ): Promise<CompanySummaryResponse> {
    try {
      if (updateSummaryDto.status === SummaryStatus.SUBMITTED || updateSummaryDto.status === SummaryStatus.POSTED) {
        this.logger.error(
          `[updateSummary] Admin can not SUBMITTED summary or POSTED summary with data - status: ${updateSummaryDto.status}`,
        );
        throw new ForbiddenException(
          `Admin can not SUBMITTED summary or POSTED summary with data - status: ${updateSummaryDto.status}`,
        );
      }

      const summary = await this.companySummaryRepository.findOne({
        where: { id: summaryId, companyInformation: { id: companyInformationId } },
        relations: ['companyInformation', 'companyInformation.company', 'companyInformation.company.user'],
      });

      if (!summary) {
        this.logger.error(`[updateSummary] Summary with ID ${summaryId} not found`);
        throw new NotFoundException(`Summary not found`);
      }

      Object.assign(summary, updateSummaryDto);
      const summarySave = await this.companySummaryRepository.save(summary);

      if (updateSummaryDto.status === SummaryStatus.REQUEST) {
        await this.sendSummaryRequestEmail(summary.companyInformation, summarySave);
      }

      return new CompanySummaryResponse(summarySave);
    } catch (error) {
      this.logger.error(`[updateSummary] Failed to update summary: ${error.message}`);
      throw new InternalServerErrorException('Failed to update summary');
    }
  }

  async updateSummaryForUser(
    companyInformationId: number,
    summaryId: number,
    updateSummaryDto: CompanySummaryDto,
    userId: string,
  ): Promise<CompanySummaryResponse> {
    if (
      updateSummaryDto.status === SummaryStatus.DRAFT_FROM_ADMIN ||
      updateSummaryDto.status === SummaryStatus.POSTED ||
      updateSummaryDto.status === SummaryStatus.REQUEST
    ) {
      this.logger.error(`[updateSummaryForUser] User can not use status of Admin - status: ${updateSummaryDto.status}`);
      throw new ForbiddenException(`User can not use status of Admin - status: ${updateSummaryDto.status}`);
    }

    const summary = await this.companySummaryRepository.findOne({
      where: { id: summaryId, companyInformation: { id: companyInformationId } },
      relations: ['companyInformation', 'companyInformation.company', 'companyInformation.company.user'],
    });

    if (!summary) {
      this.logger.error(`[updateSummaryForUser] Summary not found - summaryId: ${summaryId}`);
      throw new NotFoundException(`Summary not found`);
    }

    if (summary.companyInformation.company.user.id !== userId) {
      this.logger.error(
        `[updateSummaryForUser] UserId ${userId} do not have permission to update summary with id: ${summaryId}`,
      );
      throw new ForbiddenException('You do not have permission to update this summary');
    }

    Object.assign(summary, updateSummaryDto);
    const summarySave = await this.companySummaryRepository.save(summary);

    if (updateSummaryDto.status === SummaryStatus.SUBMITTED) {
      await this.sendSummarySubmitEmail(
        summary.companyInformation.company.user.email,
        summary.companyInformation.company.name,
        summarySave,
      );
    }
    return new CompanySummaryResponse(summarySave);
  }
}
