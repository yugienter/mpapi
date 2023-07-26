import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUser1689802610547 implements MigrationInterface {
  name = 'CreateUser1689802610547';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE role (
        id int NOT NULL, 
        name varchar(255) NOT NULL, 
        PRIMARY KEY (id)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE status (
        id int NOT NULL, 
        name varchar(255) NOT NULL, 
        PRIMARY KEY (id)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE file (
        id varchar(36) NOT NULL, 
        path varchar(255) NOT NULL, 
        PRIMARY KEY (id)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TRIGGER file_before_insert
      BEFORE INSERT ON file FOR EACH ROW 
      BEGIN
        IF new.id IS NULL THEN
          SET new.id = uuid();
        END IF;
      END;;`,
    );
    await queryRunner.query(
      `CREATE TABLE user (
        id int NOT NULL AUTO_INCREMENT, 
        email varchar(255) NULL, 
        password varchar(255) NULL, 
        provider varchar(255) NOT NULL DEFAULT 'email', 
        socialId varchar(255) NULL, 
        firstName varchar(255) NULL, 
        lastName varchar(255) NULL, 
        hash varchar(255) NULL, 
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), 
        updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), 
        deletedAt datetime(6) NULL, 
        photoId varchar(36) NULL, 
        roleId int NULL, 
        statusId int NULL, 
        INDEX IDX_9bd2fe7a8e694dedc4ec2f666f (socialId), 
        INDEX IDX_58e4dbff0e1a32a9bdc861bb29 (firstName), 
        INDEX IDX_f0e1b4ecdca13b177e2e3a0613 (lastName), 
        INDEX IDX_e282acb94d2e3aec10f480e4f6 (hash), 
        UNIQUE INDEX IDX_3be9f7978916158ca4f0d90484 (email, roleId), 
        UNIQUE INDEX IDX_e12875dfb3b1d92d7d7c5377e2 (email), 
        PRIMARY KEY (id)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `CREATE TABLE session (id int NOT NULL AUTO_INCREMENT, 
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), 
        deletedAt datetime(6) NULL, 
        userId int NULL, 
        INDEX IDX_3d2f174ef04fb312fdebd0ddc5 (userId), 
        PRIMARY KEY (id)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE forgot (id int NOT NULL AUTO_INCREMENT, 
        hash varchar(255) NOT NULL, 
        createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), 
        deletedAt datetime(6) NULL, 
        userId int NULL, 
        INDEX IDX_df507d27b0fb20cd5f7bef9b9a (hash), 
        PRIMARY KEY (id)
      ) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE user ADD CONSTRAINT FK_75e2be4ce11d447ef43be0e374f FOREIGN KEY (photoId) REFERENCES file(id) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE user ADD CONSTRAINT FK_c28e52f758e7bbc53828db92194 FOREIGN KEY (roleId) REFERENCES role(id) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE user ADD CONSTRAINT FK_dc18daa696860586ba4667a9d31 FOREIGN KEY (statusId) REFERENCES status(id) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE session ADD CONSTRAINT FK_3d2f174ef04fb312fdebd0ddc53 FOREIGN KEY (userId) REFERENCES user(id) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE forgot ADD CONSTRAINT FK_31f3c80de0525250f31e23a9b83 FOREIGN KEY (userId) REFERENCES user(id) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE forgot DROP FOREIGN KEY FK_31f3c80de0525250f31e23a9b83`,
    );
    await queryRunner.query(
      `ALTER TABLE session DROP FOREIGN KEY FK_3d2f174ef04fb312fdebd0ddc53`,
    );
    await queryRunner.query(
      `ALTER TABLE user DROP FOREIGN KEY FK_dc18daa696860586ba4667a9d31`,
    );
    await queryRunner.query(
      `ALTER TABLE user DROP FOREIGN KEY FK_c28e52f758e7bbc53828db92194`,
    );
    await queryRunner.query(
      `ALTER TABLE user DROP FOREIGN KEY FK_75e2be4ce11d447ef43be0e374f`,
    );
    await queryRunner.query(
      `DROP INDEX IDX_df507d27b0fb20cd5f7bef9b9a ON forgot`,
    );
    await queryRunner.query(`DROP TABLE forgot`);
    await queryRunner.query(
      `DROP INDEX IDX_3d2f174ef04fb312fdebd0ddc5 ON session`,
    );
    await queryRunner.query(`DROP TABLE session`);
    await queryRunner.query(
      `DROP INDEX IDX_e12875dfb3b1d92d7d7c5377e2 ON user`,
    );
    await queryRunner.query(
      `DROP INDEX IDX_3be9f7978916158ca4f0d90484 ON user`,
    );
    await queryRunner.query(
      `DROP INDEX IDX_e282acb94d2e3aec10f480e4f6 ON user`,
    );
    await queryRunner.query(
      `DROP INDEX IDX_f0e1b4ecdca13b177e2e3a0613 ON user`,
    );
    await queryRunner.query(
      `DROP INDEX IDX_58e4dbff0e1a32a9bdc861bb29 ON user`,
    );
    await queryRunner.query(
      `DROP INDEX IDX_9bd2fe7a8e694dedc4ec2f666f ON user`,
    );
    await queryRunner.query(`DROP TABLE user`);
    await queryRunner.query(`DROP TABLE file`);
    await queryRunner.query(`DROP TABLE status`);
    await queryRunner.query(`DROP TABLE role`);
  }
}
