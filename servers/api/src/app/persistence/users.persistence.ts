import { Injectable, Logger } from '@nestjs/common'
import { UserRecord } from 'firebase-admin/auth'
import _ from 'lodash'
import moment from 'moment'
import { Brackets, EntityManager } from 'typeorm'

import { ModifiedUser, safeColumnsOfUserProfile, User } from '@/app/models/user'
import { UserProfile } from '@/app/models/user-profile'
import { FirebaseInfo } from '@/app/modules/firebase.module'
import { Coded } from '@/app/utils/coded'
import { Persistence } from '@/app/utils/decorators'
import { UserUtil } from '@/app/utils/user.util'
import { CONSTANTS } from '@/config/constants'


/***
 * ユーザデータ周辺情報に関する同一トランザクション内アクセスの共通機能をまとめたもの。
 */
@Persistence()
@Injectable()
export class UsersPersistence implements Coded {
  private readonly logger = new Logger(UsersPersistence.name)

  constructor(
    private readonly firebase: FirebaseInfo
  ) {
    // nothing to do
  }

  get code(): string {
    return 'PUS' // Persistence - USers
  }


  static defaultOptForUserSearch = {
    maxNumberOfSigninHistories: 0,
  }

  /**
   * プロフィールなどを含めたひとまとまりのユーザ情報を返却する。
   * @param t
   * @param userIds
   * @param opts.maxNumberOfSigninHistories
   * @returns
   */
  async getUsers(t: EntityManager, userIds: string[], opts: {
    maxNumberOfSigninHistories?: number,
  } = UsersPersistence.defaultOptForUserSearch): Promise<ModifiedUser[]> {
    if (userIds.length == 0) {
      return []
    }
    opts = _.defaultsDeep(_.cloneDeep(opts), _.cloneDeep(UsersPersistence.defaultOptForUserSearch))

    // ユーザの一般情報一式の取得
    const users = await (async () => {
      let usersQuery = t.getRepository(User)
        .createQueryBuilder('u')
        .where('u.is_deleted = false')
        // 備考情報は明示的に取得しない限りは取ってこない（必要なものだけ絞り込む）
      usersQuery = usersQuery
        .addSelect(safeColumnsOfUserProfile.map(x => `p.${x}`))
        .innerJoin('u.profile', 'p')

      const users = await usersQuery
        .andWhere('u.id IN (:...user_ids)')
        .setParameters({
          user_ids: userIds,
        })
        .getMany()

      // 受け取った順序にソートし直す
      const invertedUserIds = _.invert(userIds)
      return _.sortBy(users, x => {
        return Number(invertedUserIds[x.id])
      })
    })()

    // それぞれのユーザについて、ModifiedUserに変換した状態で返す
    return _.map(users, user => {
      const now = new Date()
      // 一応profileを持たない場合に備えておく
      const profile = user.profile
      if (!profile.user_id) {
        profile.user_id = user.id
      }
      const fullUser = {
        ...user,
        profile,
        is_admin: user.is_admin,
      }
      return fullUser
    })
  }

  /**
   * 削除フラグが立っているものも含め、一切DB上に存在しないユーザについて、
   * Firebase-Authの側から抹消する（Google SignIn経由などの不正に作られたユーザ）。
   * @param t EntityManager
   * @param id userId
   * @returns
   */
  async deleteUserIfItDoesNotExistInDatabase(t: EntityManager, id: string) {
    const user = await t.getRepository(User).findOneBy({ id })
    if (user) {
      // DB上に存在していた場合（削除フラグありの状態を含む）、firebaseとの整合性には問題がない。
      return null
    }
    let userRec: UserRecord = null
    // firebaseの側のみユーザが存在している場合、そいつについては削除する。
    try {
      userRec = await this.firebase.auth.getUser(id)
      await this.firebase.auth.deleteUser(userRec.uid)
      this.logger.log(`User: ${id} is deleted because it is not in DB.`)
    } catch (e) {
      const code: string = e.code
      if (code == 'auth/user-not-found') {
        // do nothing
      } else {
        this.logger.error(e)
      }
    }
    return user
  }
}
