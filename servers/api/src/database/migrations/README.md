# LINK

## Types

https://orkhan.gitbook.io/typeorm/docs/entities#column-types-for-mysql--mariadb

## Command

```bash
# Drop
npm run typeorm schema:drop
# Migration
npm run typeorm migration:run
```

```bash
# Drop
yarn typeorm schema:drop
# Migration
yarn typeorm migration:run
```

## Database table in MPA Platform

#### **_companies_**

```
| Property      | Data Type                             |
|---------------|---------------------------------------|
| id            | INTEGER (PRIMARY KEY, AUTO_INCREMENT) |
| name          | VARCHAR(255)                          |
| position      | VARCHAR(255)                          |
| phone_number  | VARCHAR(20)                           |
| website       | VARCHAR(255)                          |
| user_id       | INTEGER (FOREIGN KEY users)           |
```

#### **_company_information_**

```
| Property                            | Data Type                             |
| ----------------------------------- | ------------------------------------- |
| id                                  | INTEGER (PRIMARY KEY, AUTO_INCREMENT) |
| company_id                          | INTEGER (FOREIGN KEY companies)       |
| general_shareholder_structure       | TEXT                                  |
| general_management_structure        | TEXT                                  |
| general_year_of_establishment       | INTEGER                               |
| general_headquarter                 | VARCHAR(255)                          |
| general_business_type               | VARCHAR(50)                           |
| general_business_location_country   | VARCHAR(50)                           |
| general_business_location_area      | VARCHAR(50)                           |
| general_number_of_employees         | INTEGER                               |
| business_overview                   | TEXT                                  |
| business_main_products_services     | TEXT                                  |
| business_major_clients              | TEXT                                  |
| business_major_suppliers            | TEXT                                  |
| business_future_growth_projection   | TEXT                                  |
| financial_current_valuation         | BIGINT                                |
| transaction_sell_shares_percentage  | INTEGER                               |
| transaction_sell_shares_amount      | BIGINT                                |
| transaction_issue_shares_percentage | INTEGER                               |
| transaction_issue_shares_amount     | BIGINT                                |
| transaction_other_details           | TEXT                                  |
| reason_deal_reason                  | TEXT                                  |
| reason_deal_timeline                | TEXT                                  |
```

#### **_company_financial_data_**

```
| Property               | Data Type                             |
| ---------------------- | ------------------------------------- |
| id                     | INTEGER (PRIMARY KEY, AUTO_INCREMENT) |
| company_information_id | INTEGER (FOREIGN KEY companies)       |
| year                   | INTEGER                               |
| sales                  | BIGINT                                |
| profit                 | BIGINT                                |
| EBITDA                 | BIGINT                                |
| net_asset              | BIGINT                                |
| net_debt               | BIGINT                                |
```
