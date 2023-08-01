import { ErrorInfo } from "./error-info"

/**
 * 認証系/権限系エラーでコード値を付加したもの。
 */
export class CodedException extends Error {
  /**
   *
   * @param classCode エラー発生クラスコード
   * @param info エラー発生詳細
   */
  constructor(readonly classCode: string, readonly info: ErrorInfo) {
    super()
  }
}
