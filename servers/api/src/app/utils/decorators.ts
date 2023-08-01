import { ApiBody, ApiConsumes, ApiHeaders } from '@nestjs/swagger'


/**
 * Controller(API)で基本的には必要とされているRequest-Header情報などを定義する。
 */
export const MpplatformApiDefault = () => ApiHeaders([
  {
    name: 'Accept-Language',
    schema: { default: 'ja' },
  },
  {
    name: 'X-Api-Version',
    schema: { default: '1.0' },
  }
])

export const MultipartDefault = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (target, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiConsumes('multipart/form-data')(target, propertyKey, descriptor)
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          image: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    })(target, propertyKey, descriptor)
  }
}

/**
 * DecorateされたControllerの一覧
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authorizedControllers: any[] = []

/**
 * 一般の認証（Firebaseでの認証）が必要なControllerに付ける。認証情報なしで呼び出すことの出来ないAPI。
 */
export const Authorized: () => ClassDecorator = () => {
  return (constructor) => {
    authorizedControllers.push(constructor)
  }
}

/**
 * DecorateされたServiceの一覧
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mpplatformServices: any[] = []

/**
 * サービス層のクラス一般に付ける
 */
export const Service: () => ClassDecorator = () => {
  return (constructor) => {
    mpplatformServices.push(constructor)
  }
}

/**
 * DecorateされたPersistenceの一覧
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mpplatformPersistences: any[] = []

/**
 * 永続化層のクラス一般に付ける
 */
export const Persistence: () => ClassDecorator = () => {
  return (constructor) => {
    mpplatformPersistences.push(constructor)
  }
}
