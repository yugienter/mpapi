import { webcrypto as crypto } from 'crypto'

export class RandomUtil {
  /**
   * Math.random() の代替
   *
   * 0 <= result < 1 の範囲のセキュアな乱数を返す
   */
  static secureRandom() {
    // 6バイト (readUintLEの限界) の範囲で乱数を取得して、0以上1未満の小数にして返す
    return crypto.getRandomValues(Buffer.alloc(6)).readUintLE(0, 6) / 0x1_0000_0000_0000
  }
}
