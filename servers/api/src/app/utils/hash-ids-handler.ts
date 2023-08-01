import Hashids from 'hashids'
import _ from 'lodash'


/**
 * Hashids (https://github.com/niieani/hashids.js) に関する処理を取り扱う。
 * 一部のAPIにおいては（メールにリンクを載せるなど）直接の数値のIDを用いたくなく、表示をユーザにわからない形に変換して用いる。
 */
export class HashIdsHandler {
  constructor(
    private readonly hashIds: Hashids
  ) {
    //
  }
  encodeAshashIds(value: string): string {
    return this.hashIds.encode(value)
  }

  decodeFromhashIds(value: string): string | null {
    try {
      const v = _.first(this.hashIds.decode(value))
      return v ? `${v}` : null
    } catch (e) {
      // nothing to do
    }
    return null
  }

  /**
   * hashidsによって適当な文字列に変換された情報から元のIDへ変換する。
   * 変換できそうなら変換するし、変換できなさそうならもとのやつを返す。
   * @returns 元のIDまたは復元したID
   */
  decodeFromhashIdsOrOriginal(value: string): string | null {
    try {
      const v = _.first(this.hashIds.decode(value)) ?? value
      return `${v}`
    } catch (e) {
      // nothing to do
    }
    return null
  }
}
