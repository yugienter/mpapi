import { Logger } from '@nestjs/common'
import { stringify } from 'csv-stringify/sync'
import _ from 'lodash'
import moment from 'moment'

import { ModifiedUser } from '@/app/models/user'
import { CONSTANTS } from '@/config/constants'


export class UserUtil {
  private static readonly logger = new Logger(UserUtil.name)

  static getAge(birthday: string) {
    if (
      _.isString(birthday)
    ) {
      return  moment().diff(birthday, 'years', true)
    }
    return NaN
  }
}
