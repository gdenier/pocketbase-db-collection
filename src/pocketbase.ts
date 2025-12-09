import type { CollectionConfig, SyncConfig } from '@tanstack/db'
import { Store } from '@tanstack/store'
import type PocketBase from 'pocketbase'
import type { RecordSubscription } from 'pocketbase'
import {
  TimeoutWaitingForIdsError,
  ExpectedInsertTypeError,
  ExpectedUpdateTypeError,
  ExpectedDeleteTypeError,
} from './errors'

export interface PocketBaseCollectionConfig<TItem extends object>
  extends Omit<
    CollectionConfig<TItem>,
    'onInsert' | 'onUpdate' | 'onDelete' | 'sync'
  > {
  client: PocketBase
  collectionName: string
  parse?: Partial<Record<keyof TItem, (value: any) => any>>
  serialize?: Partial<Record<keyof TItem, (value: any) => any>>
  mutationTimeout?: number
  initialFetchOptions?: {
    sort?: string
    filter?: string
    expand?: string
  }
}

export interface PocketBaseCollectionUtils {
  cancel: () => void
  isSubscribed: () => boolean
}

function convert<T extends object>(
  record: any,
  conversions?: Partial<Record<keyof T, (value: any) => any>>,
): T {
  if (!conversions) return record as T

  const result: any = { ...record }
  for (const [key, converter] of Object.entries(conversions)) {
    if (key in result && typeof converter === 'function') {
      result[key] = (converter as (value: any) => any)(result[key])
    }
  }
  return result as T
}

function convertPartial<T extends object>(
  record: Partial<any>,
  conversions?: Partial<Record<keyof T, (value: any) => any>>,
): Partial<T> {
  if (!conversions) return record as Partial<T>

  const result: any = { ...record }
  for (const [key, converter] of Object.entries(conversions)) {
    if (key in result && typeof converter === 'function') {
      result[key] = (converter as (value: any) => any)(result[key])
    }
  }
  return result as Partial<T>
}

export function pocketbaseCollectionOptions<TItem extends object>(
  config: PocketBaseCollectionConfig<TItem>,
): CollectionConfig<TItem> & { utils: PocketBaseCollectionUtils } {
  const {
    client,
    collectionName,
    parse,
    serialize,
    mutationTimeout = 120_000,
    initialFetchOptions,
    ...collectionConfig
  } = config

  const collection = client.collection(collectionName)
  let unsubscribe: (() => void) | null = null
  let isSubscribedFlag = false

  const idStore = new Store<Map<string, number>>(new Map())
  // Map to track temporary IDs -> real IDs for reconciliation
  const pendingIdMap = new Store<Map<string, string>>(new Map())

  const cleanupOldIds = () => {
    const now = Date.now()
    const fiveMinutesAgo = now - 300_000
    const ids = idStore.state
    for (const [id, timestamp] of ids.entries()) {
      if (timestamp < fiveMinutesAgo) {
        ids.delete(id)
      }
    }
    idStore.setState(() => ids)
  }

  setInterval(cleanupOldIds, 60_000)

  const awaitIds = async (ids: string[]): Promise<void> => {
    const startTime = Date.now()
    const checkInterval = 100

    return new Promise<void>((resolve, reject) => {
      const check = () => {
        const currentIds = idStore.state
        const allFound = ids.every((id) => currentIds.has(id))

        if (allFound) {
          resolve()
          return
        }

        if (Date.now() - startTime > mutationTimeout) {
          const missingIds = ids.filter((id) => !currentIds.has(id))
          reject(new TimeoutWaitingForIdsError(missingIds.join(', ')))
          return
        }

        setTimeout(check, checkInterval)
      }

      check()
    })
  }

  const sync: SyncConfig<TItem>['sync'] = (params) => {
    const { begin, write, commit, markReady } = params

    const eventBuffer: Array<RecordSubscription<any>> = []
    let isInitialSyncComplete = false

    const processEvent = (event: RecordSubscription<any>) => {
      const realId = event.record.id
      const ids = idStore.state
      ids.set(realId, Date.now())
      idStore.setState(() => ids)

      begin()
      if (event.action === 'create') {
        // Check if this real ID corresponds to a temporary ID that needs reconciliation
        const pendingIds = pendingIdMap.state
        let tempIdToDelete: string | null = null

        // Find if any tempId maps to this realId
        for (const [tempId, mappedRealId] of pendingIds.entries()) {
          if (mappedRealId === realId) {
            tempIdToDelete = tempId
            break
          }
        }

        if (tempIdToDelete) {
          // This is a reconciliation: delete the temp record, insert with real ID
          write({ type: 'delete', value: { id: tempIdToDelete } as any })
          write({ type: 'insert', value: convert(event.record, parse) })

          // Clean up the mapping
          pendingIds.delete(tempIdToDelete)
          pendingIdMap.setState(() => pendingIds)
        } else {
          // Normal insert from another source
          write({ type: 'insert', value: convert(event.record, parse) })
        }
      } else if (event.action === 'update') {
        write({ type: 'update', value: convert(event.record, parse) })
      } else if (event.action === 'delete') {
        write({ type: 'delete', value: convert(event.record, parse) })
      }
      commit()
    }

    const setupSubscription = async () => {
      // Only subscribe to realtime updates in the browser
      if (typeof window === 'undefined') {
        return
      }

      unsubscribe = await collection.subscribe('*', (event) => {
        if (!isInitialSyncComplete) {
          eventBuffer.push(event)
          return
        }
        processEvent(event)
      })
      isSubscribedFlag = true
    }

    const initialSync = async () => {
      try {
        const records = await collection.getFullList({
          sort: initialFetchOptions?.sort,
          filter: initialFetchOptions?.filter,
          expand: initialFetchOptions?.expand,
        })

        begin()
        for (const record of records) {
          const ids = idStore.state
          ids.set(record.id, Date.now())
          idStore.setState(() => ids)
          write({ type: 'insert', value: convert(record, parse) })
        }
        commit()

        isInitialSyncComplete = true

        if (eventBuffer.length > 0) {
          for (const event of eventBuffer) {
            processEvent(event)
          }
          eventBuffer.splice(0)
        }
      } finally {
        markReady()
      }
    }

    // Start subscription and initial sync
    setupSubscription()
    initialSync()

    return () => {
      if (unsubscribe) {
        unsubscribe()
        isSubscribedFlag = false
      }
    }
  }

  const onInsert: CollectionConfig<TItem>['onInsert'] = async ({ transaction }) => {
    for (const mutation of transaction.mutations) {
      if (mutation.type !== 'insert') {
        throw new ExpectedInsertTypeError(mutation.type)
      }
    }

    const realIds: string[] = []
    for (const mutation of transaction.mutations) {
      const serialized = convertPartial(mutation.modified, serialize)
      // Extract the temporary ID that TanStack DB used for optimistic update
      const { id: tempId, created, updated, ...dataWithoutMeta } = serialized as any

      // Send to PocketBase WITHOUT the ID - PocketBase will generate its own
      const record = await collection.create(dataWithoutMeta)

      // Store mapping: tempId -> realId for reconciliation
      if (tempId && record.id !== tempId) {
        const pendingIds = pendingIdMap.state
        pendingIds.set(tempId, record.id)
        pendingIdMap.setState(() => pendingIds)
      }

      realIds.push(record.id)
    }

    // Wait for the real IDs to appear via subscription
    await awaitIds(realIds)
  }

  const onUpdate: CollectionConfig<TItem>['onUpdate'] = async ({ transaction }) => {
    for (const mutation of transaction.mutations) {
      if (mutation.type !== 'update') {
        throw new ExpectedUpdateTypeError(mutation.type)
      }
    }

    const ids: string[] = []
    for (const mutation of transaction.mutations) {
      const serialized = convertPartial(mutation.changes || {}, serialize)
      const record = await collection.update(String(mutation.key), serialized)
      ids.push(record.id)
    }

    await awaitIds(ids)
  }

  const onDelete: CollectionConfig<TItem>['onDelete'] = async ({ transaction }) => {
    for (const mutation of transaction.mutations) {
      if (mutation.type !== 'delete') {
        throw new ExpectedDeleteTypeError(mutation.type)
      }
    }

    const ids: string[] = []
    for (const mutation of transaction.mutations) {
      await collection.delete(String(mutation.key))
      ids.push(String(mutation.key))
    }

    await awaitIds(ids)
  }

  return {
    ...collectionConfig,
    sync: { sync },
    onInsert,
    onUpdate,
    onDelete,
    utils: {
      cancel: () => {
        if (unsubscribe) {
          unsubscribe()
          isSubscribedFlag = false
        }
      },
      isSubscribed: () => isSubscribedFlag,
    },
  }
}
