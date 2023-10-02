import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import { MpplatformApiDefault } from '@/app/utils/decorators';

@MpplatformApiDefault()
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  @ApiOperation({
    description: 'Check the health status of the application.',
    tags: ['health'],
  })
  @Get()
  checkHealth() {
    return {
      status: 'UP',
      message: 'Application is running smoothly!',
    };
  }
}
