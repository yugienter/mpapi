import { Injectable, Logger } from '@nestjs/common';
import moment from 'moment';
import path from 'path';
import { pipeline } from 'stream';
import util from 'util';
import { v4 as uuidv4 } from 'uuid';

import { CodedException } from '@/app/exceptions/errors/coded-exception';
import { ErrorInfo } from '@/app/exceptions/errors/error-info';
import { FirebaseInfo } from '@/app/modules/firebase.module';
import { ConfigProvider } from '@/app/providers/config.provider';
import { Coded } from '@/app/utils/coded';
import { FileUtil } from '@/app/utils/file.util';
import { TimeUtil } from '@/app/utils/time.util';

@Injectable()
export class StorageProvider implements Coded {
  private readonly logger = new Logger(StorageProvider.name);

  constructor(private readonly firebase: FirebaseInfo, private readonly configProvider: ConfigProvider) {
    // nothing to do
  }

  get code(): string {
    return 'PVST';
  }

  static ERROR_CODES = {
    FAILED_TO_UPLOAD_FILE: ErrorInfo.getBuilder('FUPF', 'failed_to_upload_file'),
  };

  get errorCodes() {
    return StorageProvider.ERROR_CODES;
  }

  async getSignedUrl(movie_url: string, useBucketName = false) {
    if (this.configProvider.config.isEmulatorMode) {
      // emulatorの時にsignedなurlを発行できないので、一旦このような感じにする。
      return movie_url;
    }
    const bucketInfo = this.getBucketPathFromUrl(movie_url);
    if (!bucketInfo) {
      return null;
    }
    const signedMovie = await this.firebase.storage
      .bucket(useBucketName ? bucketInfo.bucket : undefined)
      .file(bucketInfo.path)
      .getSignedUrl({
        action: 'read',
        expires: moment(new Date()).add(1, 'day').toDate(),
      });
    return signedMovie[0];
  }

  private getBucketPathFromUrl(url: string) {
    // https://[not /]+/[not /]+/ -> remove
    const matched = url?.match(/^(https?:\/\/[^/]+)\/([^/]+)\/(.*)/);
    if (!matched) {
      return null;
    }
    return {
      baseUrl: matched[1],
      bucket: matched[2],
      path: matched[3],
    };
  }

  // async uploadThumbnail(imageUrl: string, dirPath: string, size: number) {
  //   const tmpPath = `/tmp/${uuidv4()}`
  //   await this.downloadFile(imageUrl, tmpPath)
  //   const buff = await FileUtil.getResizedBuffer(tmpPath, size)

  //   const uploadedInfo = await this.saveToBucket(buff, 'image', dirPath, {
  //     fileName: FileUtil.addSuffixToFilename(path.basename(imageUrl), '_thumb')
  //   })
  //   await FileUtil.deleteFile(tmpPath)
  //   return uploadedInfo
  // }
}
