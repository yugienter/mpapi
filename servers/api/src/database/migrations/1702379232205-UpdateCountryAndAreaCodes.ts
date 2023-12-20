import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCountryAndAreaCodes1702379232205 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const countryNameToCodeMap = {
      India: 'IN',
      Indonesia: 'ID',
      Japan: 'JP',
      'Viet Nam': 'VN',
    };

    // const areaNameToCodeMap = {
    //   Indonesia: {
    //     'DKI Jakarta': 'ID-JK',
    //     'Bangka Belitung': 'ID-BB',
    //     'Jawa Timur': 'ID-JI',
    //     Banten: 'ID-BT',
    //   },
    //   'Viet Nam': {
    //     'Thành phố Hồ Chí Minh': 'VN-SG',
    //   },
    // };

    const areaNameToCodeMap = {
      ID: {
        'Jawa Barat': 'ID-JB',
      },
    };

    // for (const country in countryNameToCodeMap) {
    // await queryRunner.query(`
    //           UPDATE company_information
    //           SET general_business_location_country = '${countryNameToCodeMap[country]}'
    //           WHERE general_business_location_country = '${country}'
    //       `);

    const areaMap = areaNameToCodeMap.ID;
    for (const area in areaMap) {
      await queryRunner.query(`
                    UPDATE company_information
                    SET general_business_location_area = '${areaMap[area]}'
                    WHERE general_business_location_area = '${area}' 
                    AND general_business_location_country = 'ID'
                `);
    }
    // }

    // for (const country in countryNameToCodeMap) {
    //   await queryRunner.query(`
    //         UPDATE company_summaries
    //         SET country = '${countryNameToCodeMap[country]}'
    //         WHERE country = '${country}'
    //     `);
    // }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    //
  }
}
