export const TIME_STAMPS_AND_ITS_USERS = [
  {
    name: 'created_at',
    type: 'timestamp',
    isNullable: false,
    default: 'CURRENT_TIMESTAMP',
    comment: '作成日'
  },
  {
    name: 'updated_at',
    type: 'timestamp',
    isNullable: false,
    default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    comment: '更新日'
  },
]
