import { Logger } from '@nestjs/common';

export class TimeUtil {
  private static readonly logger = new Logger(TimeUtil.name);

  static sleep(milliseconds: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, milliseconds);
    });
  }
}
