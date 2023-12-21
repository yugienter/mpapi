import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface Country {
  countryCode: string;
  countryName: string;
  states: any[];
}

@Injectable()
export class DataAccessProvider {
  private countries: Country[];

  constructor() {
    this.loadCountries();
  }

  private loadCountries() {
    const jsonPath = path.join(__dirname, '../../resources', 'countries.json');
    if (fs.existsSync(jsonPath)) {
      const jsonData = fs.readFileSync(jsonPath, 'utf8');
      this.countries = JSON.parse(jsonData) as Country[];
    } else {
      throw new Error('Countries file not found');
    }
  }

  public getCountryNameByCode(code: string): string {
    const country = this.countries.find((c) => c.countryCode === code);
    return country ? country.countryName : 'Unknown';
  }
}
