import { Injectable, Logger } from '@nestjs/common'
import fs from 'fs'
import Hashids from 'hashids'
import _ from 'lodash'
import path from 'path'

import { ConfigProvider } from '@/app/providers/config.provider'
import { HashIdsHandler } from '@/app/utils/hash-ids-handler'
import { CONSTANTS } from '@/config/constants'


@Injectable()
export class I18nProvider {
  private readonly logger = new Logger(I18nProvider.name)

  private static fallbackLang = 'ja'
  private static translationMap = {}

  private readonly hashIds = new Hashids(
    this.configProvider.config.hashIdsSalt,
    CONSTANTS.hashIdsPadLength,
  )
  constructor(
    private readonly configProvider: ConfigProvider
  ) {
    // nothing to do
  }

  getHashIdsHandler(): HashIdsHandler {
    return new HashIdsHandler(this.hashIds)
  }

  static async loadResources(basePath = path.join(__filename, '../../../resources/locales')) {
    const localeDirs = await fs.readdirSync(basePath)
    for (const lc of localeDirs) {
      const messageDirs = await fs.readdirSync(path.join(basePath, lc))
      I18nProvider.translationMap[lc] = {}
      for (const md of messageDirs) {
        const fileData = JSON.parse(await fs.readFileSync(path.join(basePath, lc, md), 'utf-8'))
        const key = md.replace(/\.json$/, '')
        I18nProvider.translationMap[lc][key] = fileData
      }
    }
  }

  translate(key: string, opts?: { lang: string }) {
    const tgt = I18nProvider.translationMap[opts?.lang] ?? I18nProvider.translationMap[I18nProvider.fallbackLang]
    return _.get(tgt, key, key)
  }

  t(key: string, opts?: { lang: string }) {
    return this.translate(key, opts)
  }
}
