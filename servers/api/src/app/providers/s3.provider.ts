import { MultipartFile } from '@fastify/multipart';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import * as fs from 'fs';
import { v4 as uuid } from 'uuid';

import { ConfigProvider } from '@/app/providers/config.provider';

@Injectable()
export class S3Provider {
  private s3: S3;

  constructor(private readonly configProvider: ConfigProvider) {
    // Initialize S3 with credentials from the config provider
    this.s3 = new S3({
      accessKeyId: this.configProvider.config.awsAccessKey,
      secretAccessKey: this.configProvider.config.awsSecretKey,
      region: this.configProvider.config.awsRegion,
    });
  }

  async uploadFile(file: MultipartFile, contentType, userRole: string, purpose: string): Promise<string> {
    const { filename, filepath } = file;
    const fileStream = fs.createReadStream(filepath);
    const folderPath = `${userRole}/${purpose}/`;

    const key = `${folderPath}${uuid()}-${filename}`;

    const uploadResult = await this.s3
      .upload({
        Bucket: this.configProvider.config.awsPublicBucketName,
        Body: fileStream,
        Key: key,
        ContentType: contentType,
      })
      .promise();

    if (uploadResult) {
      return uploadResult.Location;
    } else {
      throw new InternalServerErrorException('Error when upload to S3');
    }
  }

  async getPreSignedUrl(key: string): Promise<string> {
    const url = await this.s3.getSignedUrlPromise('getObject', {
      Bucket: this.configProvider.config.awsPublicBucketName,
      Key: key,
      Expires: 60,
    });

    return url;
  }
}
