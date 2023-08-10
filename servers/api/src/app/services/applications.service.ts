import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CodedInvalidArgumentException } from '@/app/exceptions/errors/coded-invalid-argument.exception';
import { ErrorInfo } from '@/app/exceptions/errors/error-info';
import { Coded } from '@/app/utils/coded';
import { Service } from '@/app/utils/decorators';

@Service()
@Injectable()
export class ApplicationsService implements Coded {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(private readonly datasource: DataSource) {
    // nothing to do
  }

  get code(): string {
    return 'SAPP'; // Service - Applications
  }

  static ERROR_CODES = {
    NO_RELEASE_FOUND: ErrorInfo.getBuilder('NRF', 'no_release_found'),
  };

  get errorCodes() {
    return ApplicationsService.ERROR_CODES;
  }
}
