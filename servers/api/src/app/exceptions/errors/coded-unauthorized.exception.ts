import { CodedException } from './coded-exception';
import { ErrorInfo } from './error-info';

/**
 * 認証系/権限系エラーでコード値を付加したもの。
 */
export class CodedUnauthorizedException extends CodedException {
  /**
   *
   * @param classCode エラー発生クラスコード
   * @param info エラー発生詳細
   */
  constructor(readonly classCode: string, readonly info: ErrorInfo) {
    super(classCode, info);
  }
}
