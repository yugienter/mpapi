import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import _ from 'lodash'
import path from 'path'
import { firstValueFrom } from 'rxjs'

import { ConfigProvider } from '@/app/providers/config.provider'
import { Coded } from '@/app/utils/coded'
import { CONSTANTS } from '@/config/constants'


@Injectable()
export class SlackProvider implements Coded {
  private readonly logger = new Logger(SlackProvider.name)

  constructor(
    private readonly configProvider: ConfigProvider,
    private readonly httpService: HttpService,
  ) {
    // nothing to do
  }

  get code(): string {
    return 'PVSLC'
  }

  useDebugChannnel() {
    const conf = this.configProvider.config
    return conf.appEnv != 'production'
  }

  async postToSlack(channelId: string, message: string) {
    // NOTICE: 社内のスラックに通知するだけ(影響度少)なので、エラーが発生した場合はログに出力し、正常終了させる
    try {
      const result = await firstValueFrom(this.httpService.post(
        path.join(this.configProvider.config.slackApiHost, 'api/chat.postMessage'),
        {
          channel: channelId,
          text: message
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.configProvider.config.slackAuthToken}`,
          }
        }
      ))
      if (_.get(result, 'data.ok')) {
        this.logger.log(`a message is sent to ${channelId}`)
      } else {
        throw new Error(`a message could not be sent to ${channelId} reason: ${result.data.error}`)
      }
    } catch (e) {
      this.logger.error(e)
    }
  }

}
