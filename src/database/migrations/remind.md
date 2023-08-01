### Run migration with Entity has field UUID

1. Generate migration file.
2. Go to new file migration and after create table have UUID field add this code :
   ```bash
       await queryRunner.query(
       `CREATE TRIGGER `table_before_insert`
       BEFORE INSERT ON `table` FOR EACH ROW
       BEGIN
           IF new.id IS NULL THEN
           SET new.id = uuid();
           END IF;
       END;;`,
       );
   ```
   Where `table` is name of table.

### migration with utf9 charset :

If have the table need to save text utf8 :

```
ALTER DATABASE dbname CHARACTER SET utf8 COLLATE utf8_general_ci;

```

```
ALTER TABLE tbl_name CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;
```
