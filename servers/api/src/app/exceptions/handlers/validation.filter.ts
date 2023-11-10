import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ValidationError } from 'class-validator';
import _ from 'lodash';

import { ValidationException } from '@/app/exceptions/errors/validation.exception';

@Catch(ValidationException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {
    // nothing to do
  }

  catch(exception: ValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse();
    const status = HttpStatus.UNPROCESSABLE_ENTITY;
    const { httpAdapter } = this.httpAdapterHost;

    const lang = request.headers['accept-language'] ?? request.headers['content-language'];

    this.logger.verbose(`422 Error: ${exception.message}`);

    const validationErrors = this.formatErrors(exception.errors);

    httpAdapter.reply(
      response,
      {
        message: 'unprocessable_entity',
        translated: 'Invalid arguments',
        code: null,
        errors: validationErrors,
      },
      status,
    );
  }

  formatErrors(errors: ValidationError[]): Record<string, unknown> {
    const formattedErrors = {};

    _.forEach(errors, (error) => {
      if (error.children && error.children.length > 0) {
        formattedErrors[error.property] = this.formatErrors(error.children);
      } else {
        formattedErrors[error.property] = _.values(error.constraints)[0];
      }
    });

    return formattedErrors;
  }
}
