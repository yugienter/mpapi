import { CodedException } from './coded-exception'
import { ErrorInfo } from './error-info'
/**
 * validationで弾けなかった異常データに対して、エラーコードを付記したもの。
 */
export class CodedInvalidArgumentException extends CodedException {
  /**
   *
   * @param classCode エラー発生クラスコード
   * @param info エラー詳細
   */
  constructor(readonly classCode: string, readonly info: ErrorInfo) {
    super(classCode, info)
  }
}
