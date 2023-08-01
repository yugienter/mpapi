import { Logger } from '@nestjs/common'
import fs from 'fs'
import _ from 'lodash'
import sharp from 'sharp'


export class FileUtil {
  private static readonly logger = new Logger(FileUtil.name)

  static extractExt(filename: string) {
    const ext = _.last(filename.split('.')) ?? ''
    return {
      filenameWithoutExt: filename.substring(0, filename.length - ext.length - (ext.length > 0 ? 1 : 0)),
      ext,
    }
  }

  static addSuffixToFilename(filename: string, suffix: string) {
    const extInfo = FileUtil.extractExt(filename)
    return `${extInfo.filenameWithoutExt}${suffix}.${extInfo.ext}`
  }

  /**
   * Buffer画像情報を縮小（拡大）させる。
   * @param filepath
   * @param size
   * @returns
   */
  static async getResizedBuffer(filepath: string, size: number) {
    const tmpData = sharp(filepath)
    const meta = await tmpData.metadata()
    if (!meta.width || !meta.height) {
      return tmpData.toBuffer()
    }
    if (meta.width >= meta.height) {
      return await tmpData
        .resize(size, Math.floor(size * meta.height / meta.width))
        .toBuffer()
    } else {
      return await tmpData
        .resize(Math.floor(size * meta.width / meta.height), size)
        .toBuffer()
    }
  }

  static async deleteFile(filepath: string) {
    await fs.unlinkSync(filepath)
  }
}
