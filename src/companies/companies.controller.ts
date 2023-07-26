import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CompaniesService } from './companies.service';

@ApiTags('Home')
@Controller()
export class CompaniesController {
  constructor(private service: CompaniesService) {}

  @Get()
  companyInfo() {
    // return this.service.companyInfo();
  }
}
