import { TanStackDBError } from '@tanstack/db'

export class PocketBaseDBCollectionError extends TanStackDBError {
  constructor(message: string) {
    super(message)
    this.name = 'PocketBaseDBCollectionError'
  }
}

export class TimeoutWaitingForIdsError extends PocketBaseDBCollectionError {
  constructor(ids: string) {
    super(`Timeout waiting for IDs: ${ids}`)
    this.name = 'TimeoutWaitingForIdsError'
  }
}

export class ExpectedInsertTypeError extends PocketBaseDBCollectionError {
  constructor(type: string) {
    super(`Expected insert type, got ${type}`)
    this.name = 'ExpectedInsertTypeError'
  }
}

export class ExpectedUpdateTypeError extends PocketBaseDBCollectionError {
  constructor(type: string) {
    super(`Expected update type, got ${type}`)
    this.name = 'ExpectedUpdateTypeError'
  }
}

export class ExpectedDeleteTypeError extends PocketBaseDBCollectionError {
  constructor(type: string) {
    super(`Expected delete type, got ${type}`)
    this.name = 'ExpectedDeleteTypeError'
  }
}

export class SubscriptionError extends PocketBaseDBCollectionError {
  constructor(message: string) {
    super(`Subscription error: ${message}`)
    this.name = 'SubscriptionError'
  }
}
