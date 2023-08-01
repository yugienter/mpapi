export class ErrorInfo {
  constructor(readonly message: string, readonly typeCode: string, readonly posCode: string) {
    //
  }

  static getBuilder(typeCode: string, message = '') {
    return (posCode: string) => new ErrorInfo(message, typeCode, posCode)
  }
}
