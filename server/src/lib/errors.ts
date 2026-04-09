export class PublicError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 400) {
    super(message)
    this.name = 'PublicError'
    this.statusCode = statusCode
  }
}

