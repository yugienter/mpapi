// import { MigrationInterface, QueryRunner } from 'typeorm';

// export class CreateCompanyTable1690261660935 implements MigrationInterface {
//   name = 'CreateCompanyTable1690261660935';

//   public async up(queryRunner: QueryRunner): Promise<void> {
//     await queryRunner.query(
//       `CREATE TABLE company (id int NOT NULL AUTO_INCREMENT,
//         name varchar(255) NOT NULL,
//         position varchar(255) NOT NULL,
//         description_1 varchar(255) NOT NULL,
//         description_2 varchar(32770) NOT NULL,
//         country varchar(255) NOT NULL,
//         area varchar(255) NOT NULL,
//         areaOther tinyint NOT NULL,
//         typeOfBusiness varchar(255) NOT NULL,
//         commodity varchar(255) NOT NULL,
//         willingTo tinyint NOT NULL,
//         dateOfEstablishment varchar(255) NOT NULL,
//         annualRevenue decimal(10,2) NULL,
//         annualProfit decimal(10,2) NULL,
//         numberOfEmployees int NULL,
//         sellOfShares int NULL,
//         expectedPriceOfShares int NULL,
//         expectedPriceOfSharesPercent int NULL,
//         issuanceRaiseMoney int NULL,
//         issuancePriceOfShares int NULL,
//         issuancePriceOfSharesPercent int NULL,
//         businessCollaboration tinyint NOT NULL DEFAULT 0,
//         collaborationDetail varchar(32770) NULL,
//         createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
//         updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
//         deletedAt datetime(6) NULL,
//         userId int NULL,
//         UNIQUE INDEX REL_c41a1d36702f2cd0403ce58d33 (userId),
//         PRIMARY KEY (id)
//       ) ENGINE=InnoDB`,
//     );

//     await queryRunner.query(
//       `ALTER TABLE company ADD CONSTRAINT FK_c41a1d36702f2cd0403ce58d33a FOREIGN KEY (userId) REFERENCES user(id) ON DELETE NO ACTION ON UPDATE NO ACTION`,
//     );
//   }

//   public async down(queryRunner: QueryRunner): Promise<void> {
//     await queryRunner.query(`ALTER TABLE company DROP FOREIGN KEY FK_c41a1d36702f2cd0403ce58d33a`);
//     await queryRunner.query(`DROP INDEX REL_c41a1d36702f2cd0403ce58d33 ON company`);
//     await queryRunner.query(`DROP TABLE company`);
//   }
// }
