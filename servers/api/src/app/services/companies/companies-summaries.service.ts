import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { AddSummaryToMasterDto, CompanySummaryDto } from '@/app/controllers/dto/company_summary.dto';
import { SearchSummaryDto } from '@/app/controllers/dto/company_summary_search.dto';
import { CompanySummaryResponse, SummaryOptions } from '@/app/controllers/viewmodels/company_summary.response';
import { CompanyInformation } from '@/app/models/company_information';
import {
  AnnualRevenueEnum,
  CompanySummary,
  NumberOfEmployeesEnum,
  SummaryStatus,
  YearsEnum,
} from '@/app/models/company_summaries';
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

  async getSummaryForUser(companyInformationId: number, userId: string): Promise<CompanySummaryResponse | null> {
    try {
      const summary = await this.companySummaryRepository.findOne({
        where: {
          companyInformation: { id: companyInformationId },
          status: Not(SummaryStatus.DRAFT_FROM_ADMIN),
        },
        relations: ['companyInformation', 'companyInformation.company', 'companyInformation.company.user'],
        order: { version: 'DESC' },
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
        area: this.dataAccessProvider.getStateNameByCountryAndStateCode(summary.country, summary.area),
        title: summary.title,
        typeOfBusiness: summary.type_of_business,
        content: summary.content,
        annualRevenue: this.dataAccessProvider.getEnumValueByKey(AnnualRevenueEnum, summary.annual_revenue),
        numberOfEmployees: this.dataAccessProvider.getEnumValueByKey(
          NumberOfEmployeesEnum,
          summary.number_of_employees,
        ),
        years: this.dataAccessProvider.getEnumValueByKey(YearsEnum, summary.years),
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
        area: this.dataAccessProvider.getStateNameByCountryAndStateCode(summary.country, summary.area),
        title: summary.title,
        typeOfBusiness: summary.type_of_business,
        content: summary.content,
        annualRevenue: this.dataAccessProvider.getEnumValueByKey(AnnualRevenueEnum, summary.annual_revenue),
        numberOfEmployees: this.dataAccessProvider.getEnumValueByKey(
          NumberOfEmployeesEnum,
          summary.number_of_employees,
        ),
        years: this.dataAccessProvider.getEnumValueByKey(YearsEnum, summary.years),
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

  private async findRelatedPostedSummary(
    companyInformationId: number,
    excludeSummaryId?: number,
  ): Promise<CompanySummary | null> {
    const query = this.companySummaryRepository
      .createQueryBuilder('summary')
      .where('summary.companyInformation.id = :companyInformationId', { companyInformationId })
      .andWhere('summary.status = :status', { status: SummaryStatus.POSTED });

    if (excludeSummaryId) {
      query.andWhere('summary.id != :excludeSummaryId', { excludeSummaryId });
    }

    return query.orderBy('summary.version', 'DESC').getOne();
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

    if (summary.status === SummaryStatus.DRAFT_FROM_ADMIN || summary.status === SummaryStatus.POSTED) {
      throw new ForbiddenException(
        `User can not update summary because it still in Admin side or posted to investor side`,
      );
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

  // Admin
  async createSummary(
    companyInformationId: number,
    createSummaryDto: CompanySummaryDto,
  ): Promise<CompanySummaryResponse> {
    this.logger.debug(`[createSummary]`);
    try {
      const companyInformation = await this.companyInformationRepository.findOne({
        where: { id: companyInformationId },
        relations: ['company', 'company.user'],
      });
      if (!companyInformation) {
        this.logger.error(`CompanyInformation with ID ${companyInformationId} not found`);
        throw new NotFoundException(`CompanyInformation with ID ${companyInformationId} not found`);
      }

      const postedSummary = await this.companySummaryRepository.findOne({
        where: { companyInformation: { id: companyInformationId }, status: SummaryStatus.POSTED },
        order: { version: 'DESC' },
      });

      const summaryData = {
        ...createSummaryDto,
        companyInformation: companyInformation,
        original_version_id: postedSummary ? postedSummary.id : null,
        version: postedSummary ? postedSummary.version + 1 : 1,
      };

      const summary = this.companySummaryRepository.create(summaryData);
      const summarySave = await this.companySummaryRepository.save(summary);

      if (createSummaryDto.status === SummaryStatus.REQUEST) {
        await this.sendSummaryRequestEmail(companyInformation, summarySave);
      }

      return new CompanySummaryResponse(summarySave, postedSummary?.id);
    } catch (error) {
      this.logger.error(`Failed to create summary: ${error.message}`);
      throw new InternalServerErrorException('Failed to create summary');
    }
  }

  async updateSummary(
    companyInformationId: number,
    summaryId: number,
    updateSummaryDto: CompanySummaryDto,
  ): Promise<CompanySummaryResponse> {
    this.logger.debug(`[updateSummary]`);
    try {
      if (updateSummaryDto.status === SummaryStatus.SUBMITTED || updateSummaryDto.status === SummaryStatus.POSTED) {
        this.logger.error(
          `Admin can not SUBMITTED summary or POSTED summary with data - status: ${updateSummaryDto.status}`,
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
        this.logger.error(`Summary with ID ${summaryId} not found`);
        throw new NotFoundException(`Summary not found`);
      }

      if (summary.status === SummaryStatus.POSTED) {
        this.logger.error('Can not edit summary with status POSTED');
        throw new ForbiddenException('Can not edit summary with status POSTED');
      }

      Object.assign(summary, updateSummaryDto);
      const summarySave = await this.companySummaryRepository.save(summary);

      if (updateSummaryDto.status === SummaryStatus.REQUEST) {
        await this.sendSummaryRequestEmail(summary.companyInformation, summarySave);
      }

      const relatedPostedSummary = await this.findRelatedPostedSummary(companyInformationId, summaryId);

      return new CompanySummaryResponse(summarySave, relatedPostedSummary?.id);
    } catch (error) {
      this.logger.error(`Failed to update summary: ${error.message}`);
      throw new InternalServerErrorException('Failed to update summary');
    }
  }

  async getSummaryForAdmin(companyInformationId: number): Promise<CompanySummaryResponse | null> {
    try {
      const summary = await this.companySummaryRepository.findOne({
        where: { companyInformation: { id: companyInformationId } },
        order: { version: 'DESC' },
      });

      if (!summary) {
        return null;
      }

      const relatedPostedSummary = await this.findRelatedPostedSummary(companyInformationId, summary.id);

      return new CompanySummaryResponse(summary, relatedPostedSummary?.id);
    } catch (error) {
      this.logger.error(`[getSummaryForAdmin] Failed to get summary: ${error.message}`);
      throw new InternalServerErrorException('Failed to get summary');
    }
  }

  async addSummaryToMaster(
    companySummaryId: number,
    { is_public }: AddSummaryToMasterDto,
  ): Promise<CompanySummaryResponse> {
    this.logger.debug(`[addSummaryToMaster] summaryId: ${companySummaryId}`);
    const summary = await this.companySummaryRepository.findOne({
      where: { id: companySummaryId },
      relations: ['companyInformation'],
    });
    if (!summary) {
      this.logger.error(`Summary not found`);
      throw new NotFoundException('Summary not found');
    }

    if (summary.status === SummaryStatus.SUBMITTED) {
      summary.status = SummaryStatus.POSTED;

      const existingSummary = await this.companySummaryRepository.findOne({
        where: {
          companyInformation: { id: summary.companyInformation.id },
          status: SummaryStatus.POSTED,
        },
        order: { card_order: 'DESC' },
      });

      if (existingSummary) {
        summary.card_order = existingSummary.card_order;
        summary.added_to_master_at = existingSummary.added_to_master_at;
      } else {
        const highestOrder = await this.companySummaryRepository
          .createQueryBuilder('summary')
          .select('MAX(summary.card_order)', 'max')
          .getRawOne();
        summary.card_order = highestOrder.max !== null ? highestOrder.max + 1 : 1;
        summary.added_to_master_at = new Date();
      }
    } else if (summary.status !== SummaryStatus.POSTED) {
      this.logger.error(`Admin can not POSTED summary have not SUBMITTED`);
      throw new ForbiddenException(`Admin can not POSTED summary have not SUBMITTED`);
    }

    summary.is_public = is_public;

    await this.companySummaryRepository.save(summary);

    return new CompanySummaryResponse(summary);
  }

  async getLatestPostedSummaries(): Promise<CompanySummary[]> {
    try {
      return this.companySummaryRepository
        .createQueryBuilder('summary')
        .where('summary.status = :status', { status: SummaryStatus.POSTED })
        .innerJoin(
          (subQuery) => {
            return subQuery
              .select(['subSummary.company_information_id', 'MAX(subSummary.version) as max_version'])
              .from(CompanySummary, 'subSummary')
              .where('subSummary.status = :status', { status: SummaryStatus.POSTED })
              .groupBy('subSummary.company_information_id');
          },
          'latestSummary',
          'summary.company_information_id = latestSummary.company_information_id AND summary.version = latestSummary.max_version',
        )
        .orderBy('summary.card_order', 'ASC')
        .getMany();
    } catch (error) {
      this.logger.error(`Failed to get latest posted summaries: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve summaries');
    }
  }

  async getSummaryPostedByIdForAdmin(summaryId: number) {
    this.logger.debug('[getSummaryPostedByIdForAdmin]');
    try {
      const summary = await this.companySummaryRepository.findOne({
        where: { id: summaryId, status: SummaryStatus.POSTED },
        relations: ['companyInformation'],
      });
      if (!summary) {
        this.logger.error(`Summary Posted with ID ${summaryId} not found`);
        throw new NotFoundException(`Summary Posted not found`);
      }
      return new CompanySummaryResponse(summary);
    } catch (error) {
      this.logger.error(`Failed to get posted summaries: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve summaries');
    }
  }

  async getUniqueSummaryValues(): Promise<SummaryOptions> {
    const latestVersionSubquery = this.companySummaryRepository
      .createQueryBuilder('subSummary')
      .select(['companyInformation.id AS companyInformationId', 'MAX(subSummary.version) AS maxVersion'])
      .innerJoin('subSummary.companyInformation', 'companyInformation')
      .where('subSummary.status = :status', { status: SummaryStatus.POSTED })
      .groupBy('companyInformation.id');

    const query = this.companySummaryRepository
      .createQueryBuilder('summary')
      .innerJoin(
        '(' + latestVersionSubquery.getQuery() + ')',
        'latestSummary',
        'summary.companyInformation.id = latestSummary.companyInformationId AND summary.version = latestSummary.maxVersion',
      )
      .setParameters(latestVersionSubquery.getParameters());

    const countries = await query.select('DISTINCT summary.country', 'country').getRawMany();
    const areas = await query.select('DISTINCT summary.area', 'area').getRawMany();
    const typesOfBusiness = await query.select('DISTINCT summary.type_of_business', 'typeOfBusiness').getRawMany();

    return {
      countries: countries.map((item) => item.country),
      areas: areas.map((item) => item.area),
      type_of_business: typesOfBusiness.map((item) => item.typeOfBusiness),
    };
  }

  async searchSummaries(searchSummaryDto: SearchSummaryDto): Promise<CompanySummaryResponse[]> {
    const { type_of_business, years, country, area, number_of_employees, annual_revenue, keyword } = searchSummaryDto;

    const latestVersionSubquery = this.companySummaryRepository
      .createQueryBuilder('subSummary')
      .select(['subSummary.company_information_id AS companyInformationId', 'MAX(subSummary.version) AS maxVersion'])
      .where('subSummary.status = :status', { status: SummaryStatus.POSTED })
      .groupBy('subSummary.company_information_id');

    const query = this.companySummaryRepository
      .createQueryBuilder('summary')
      .innerJoin(
        '(' + latestVersionSubquery.getQuery() + ')',
        'latestSummary',
        'summary.company_information_id = latestSummary.companyInformationId AND summary.version = latestSummary.maxVersion',
      )
      .setParameters(latestVersionSubquery.getParameters())
      .where('summary.status = :status', { status: SummaryStatus.POSTED })
      .orderBy('summary.card_order', 'ASC');

    const searchConditions = [];
    const parameters = {};

    if (type_of_business && type_of_business.length) {
      searchConditions.push('summary.type_of_business IN (:...typeOfBusiness)');
      parameters['typeOfBusiness'] = type_of_business;
    }

    if (years && years.length) {
      searchConditions.push('summary.years IN (:...years)');
      parameters['years'] = years;
    }

    if (country && country.length) {
      searchConditions.push('summary.country IN (:...country)');
      parameters['country'] = country;
    }

    if (area && area.length) {
      searchConditions.push('summary.area IN (:...area)');
      parameters['area'] = area;
    }

    if (number_of_employees && number_of_employees.length) {
      searchConditions.push('summary.number_of_employees IN (:...numberOfEmployees)');
      parameters['numberOfEmployees'] = number_of_employees;
    }

    if (annual_revenue && annual_revenue.length) {
      searchConditions.push('summary.annual_revenue IN (:...annualRevenue)');
      parameters['annualRevenue'] = annual_revenue;
    }

    if (keyword) {
      searchConditions.push('(summary.title LIKE :keyword OR summary.content LIKE :keyword)');
      parameters['keyword'] = `%${keyword}%`;
    }

    if (searchConditions.length > 0) {
      query.andWhere(searchConditions.join(' AND '), parameters);
    }

    try {
      const summaries = await query.getMany();
      return summaries.map((summary) => new CompanySummaryResponse(summary));
    } catch (error) {
      this.logger.error(`[searchSummaries] Failed to search summaries: ${error.message}`);
      throw new InternalServerErrorException('Failed to search summaries');
    }
  }
}
