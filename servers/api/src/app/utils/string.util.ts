import { RandomUtil } from '@/app/utils/random.util';

export class StringUtil {
  /**
   * 英数字を含むランダムな文字列を作成する (secureRandomを使用)
   */
  static createRandomString(length: number) {
    const chars = [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'];
    const buf: string[] = [];
    for (let i = 0; i < length; i++) {
      buf.push(chars[Math.floor(RandomUtil.secureRandom() * chars.length)]);
    }
    return buf.join('');
  }
}
