import { Injectable, Logger } from '@nestjs/common'
import { DataSource, } from 'typeorm'

import { CodedInvalidArgumentException } from '@/app/exceptions/errors/coded-invalid-argument.exception'
import { ErrorInfo } from '@/app/exceptions/errors/error-info'
import { StorageProvider } from '@/app/providers/storage.provider'
import { Coded } from '@/app/utils/coded'
import { Authorized, Service } from '@/app/utils/decorators'


@Service()
@Authorized()
@Injectable()
export class MastersService implements Coded {
  private readonly logger = new Logger(MastersService.name)

  constructor(
    private readonly datasource: DataSource,
    private readonly storageProvider: StorageProvider,
  ) {
    // nothing to do
  }

  get code(): string {
    return 'SMS' // Service - MaSters
  }

  static ERROR_CODES = {
  }

  get errorCodes() {
    return MastersService.ERROR_CODES
  }

}
