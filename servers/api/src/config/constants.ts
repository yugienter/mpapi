type DispAndValue = {
  disp: string;
  value: string;
};

/**
 * アプリケーション全体で用いる定数情報を格納する。
 * （環境情報とは異なりアプリの改修が行われない限りは普遍の情報）
 */
export const CONSTANTS = {
  default_thumbnail_size: 500,
  csv_datetime_default_format: 'YYYY-MM-DD HH:mm:ss',
  genders: {
    M: {
      value: 1,
    },
    F: {
      value: 2,
    },
  },
  hashIdsPadLength: 20,
  allowed_methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
};
