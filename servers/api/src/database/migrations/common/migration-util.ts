export const TIME_STAMPS_AND_ITS_USERS = [
  {
    name: 'created_at',
    type: 'timestamp',
    isNullable: false,
    default: 'CURRENT_TIMESTAMP',
  },
  {
    name: 'updated_at',
    type: 'timestamp',
    isNullable: false,
    default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  },
];

export const TIME_STAMPS_WITH_SOFT_DELETE = [
  ...TIME_STAMPS_AND_ITS_USERS,
  {
    name: 'deleted_at',
    type: 'timestamp',
    isNullable: true,
    default: null,
  },
];
