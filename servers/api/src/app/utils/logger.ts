import { LoggerService } from '@nestjs/common'
import { Logger } from 'winston'


export class WinstonLogger implements LoggerService {
  constructor(private readonly logger: Logger) {
    // nothing to do
  }
  log(message, context?: string) {
    this.logger.info(message, { context })
    //
  }
  error(message, trace?: string, context?: string) {
    this.logger.error(message, { stack: trace, context })
    //
  }
  warn(message, context?: string) {
    this.logger.warn(message, { context })
    //
  }
  debug(message, context?: string) {
    this.logger.debug(message, { context })
    //
  }
  verbose(message, context?: string) {
    this.logger.verbose(message, { context })
  }
}
