
export class ValidationException extends Error {
  constructor(readonly message, readonly errors) {
    super()
  }
}
