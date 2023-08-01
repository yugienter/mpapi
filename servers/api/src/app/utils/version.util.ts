import { Logger } from '@nestjs/common'
import _ from 'lodash'

import { ModifiedUser } from '@/app/models/user'


export class VersionUtil {

  private static readonly logger = new Logger(VersionUtil.name)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, complexity
  static async fixUser(data: ModifiedUser, version = 1.0) {
    if (!data) {
      return
    }
    _.set(data, 'user_id', data.profile?.user_id ?? null)
    _.set(data, 'name_sei', data.profile?.name_sei ?? null)
    _.set(data, 'name_mei', data.profile?.name_mei ?? null)
    _.set(data, 'kana_name_sei', data.profile?.kana_name_sei ?? null)
    _.set(data, 'kana_name_mei', data.profile?.kana_name_mei ?? null)
    _.set(data, 'gender_type', data.profile?.gender_type ?? null)
    _.set(data, 'birthday', data.profile?.birthday ?? null)
    _.set(data, 'gender', data.profile?.gender_type ?? null)
  }

  static fixIdStringsToNumber(data, keys: string[]) {
    for (const k of keys) {
      const value = data[k]
      if (value === undefined) {
        continue
      }
      if (_.isArray(value)) {
        data[k] = _.map(value, x => {
          return _.isNil(x) ? x : _.toNumber(x)
        })
      } else {
        data[k] = _.isNil(value) ? value : _.toNumber(value)
      }
    }
  }
}
