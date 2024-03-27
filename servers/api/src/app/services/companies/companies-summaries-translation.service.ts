import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  CreateSummaryTranslationDto,
  UpdateSummaryTranslationDto,
} from '@/app/controllers/dto/company_summary_translation.dto';
import { CompanySummaryTranslationResponse } from '@/app/controllers/viewmodels/company_summary_translation.response';
import { CompanySummary } from '@/app/models/company_summaries';
import { CompanySummaryTranslation } from '@/app/models/company_summaries_translations';
import { Service } from '@/app/utils/decorators';

@Service()
@Injectable()
export class CompanySummaryTranslationsService {
  private readonly logger = new Logger(CompanySummaryTranslationsService.name);

  constructor(
    @InjectRepository(CompanySummaryTranslation)
    private summaryTranslationRepository: Repository<CompanySummaryTranslation>,
    @InjectRepository(CompanySummary)
    private companySummaryRepository: Repository<CompanySummary>,
  ) // eslint-disable-next-line no-empty-function
  {}

  async createSummaryTranslation(
    companySummaryId: number,
    createDto: CreateSummaryTranslationDto,
  ): Promise<CompanySummaryTranslationResponse> {
    try {
      const companySummary = await this.companySummaryRepository.findOne({ where: { id: companySummaryId } });
      if (!companySummary) {
        throw new NotFoundException('Company summary not found');
      }

      const newTranslation = this.summaryTranslationRepository.create({
        ...createDto,
        companySummary: companySummary,
      });

      const savedTranslation = await this.summaryTranslationRepository.save(newTranslation);
      return new CompanySummaryTranslationResponse(savedTranslation, companySummary.id);
    } catch (error) {
      this.logger.error(`Failed to create summary translation: ${error.message}`);
      throw new InternalServerErrorException('Failed to create summary translation');
    }
  }

  async updateSummaryTranslation(
    companySummaryId: number,
    translationId: number,
    updateDto: UpdateSummaryTranslationDto,
  ): Promise<CompanySummaryTranslationResponse> {
    try {
      const translation = await this.summaryTranslationRepository.findOne({
        where: { id: translationId, companySummary: { id: companySummaryId } },
      });

      if (!translation) {
        throw new NotFoundException('Summary translation not found');
      }

      Object.assign(translation, updateDto);
      const updatedTranslation = await this.summaryTranslationRepository.save(translation);
      return new CompanySummaryTranslationResponse(updatedTranslation, companySummaryId);
    } catch (error) {
      this.logger.error(`Failed to update summary translation: ${error.message}`);
      throw new InternalServerErrorException('Failed to update summary translation');
    }
  }

  async getSummaryTranslations(companySummaryId: number): Promise<CompanySummaryTranslationResponse[]> {
    try {
      const translations = await this.summaryTranslationRepository.find({
        where: { companySummary: { id: companySummaryId } },
      });

      return translations.map((t) => new CompanySummaryTranslationResponse(t, companySummaryId));
    } catch (error) {
      this.logger.error(`Failed to get summary translations: ${error.message}`);
      throw new InternalServerErrorException('Failed to get summary translations');
    }
  }
}
