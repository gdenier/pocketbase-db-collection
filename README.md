# @gdenier/pocketbase-db-collection

PocketBase collection for TanStack DB - A collection options creator that integrates [PocketBase](https://pocketbase.io/) with [TanStack DB](https://tanstack.com/db).

## Installation

```bash
npm install @gdenier/pocketbase-db-collection @tanstack/db pocketbase
```

```bash
yarn add @gdenier/pocketbase-db-collection @tanstack/db pocketbase
```

```bash
pnpm add @gdenier/pocketbase-db-collection @tanstack/db pocketbase
```

## Quick Start

```typescript
import { createCollection } from '@tanstack/db'
import { pocketbaseCollectionOptions } from '@gdenier/pocketbase-db-collection'
import PocketBase from 'pocketbase'

const pb = new PocketBase('https://your-pocketbase-url.com')

interface Todo {
  id: string
  title: string
  completed: boolean
  created: string
  updated: string
}

const todos = createCollection(
  pocketbaseCollectionOptions<Todo>({
    client: pb,
    collectionName: 'todos',
    getKey: (item) => item.id,
  })
)

todos.insert({ title: 'Buy milk', completed: false })

todos.subscribe((state) => {
  console.log('Todos:', state.items)
})
```

## Features

- **Bidirectional Sync**: Automatic real-time synchronization with PocketBase using Server-Sent Events (SSE)
- **Type-Safe**: Full TypeScript support with generics
- **Data Transformation**: Optional parse/serialize functions for custom data transformations
- **Mutation Tracking**: Built-in ID tracking to prevent duplicate operations
- **Error Handling**: Comprehensive error types for debugging

## Configuration Options

### Required Options

- **client**: `PocketBase` - PocketBase client instance
- **collectionName**: `string` - Name of the PocketBase collection
- **getKey**: `(item: TItem) => string | number` - Function to extract unique key from items

### Optional Options

- **parse**: `Partial<Record<keyof TItem, (value: any) => any>>` - Transform data from PocketBase format to your local format
- **serialize**: `Partial<Record<keyof TItem, (value: any) => any>>` - Transform data from your local format to PocketBase format
- **mutationTimeout**: `number` - Timeout in milliseconds for mutation confirmation (default: 120000)
- **initialFetchOptions**: Object with optional sort, filter, and expand parameters
  - **sort**: `string` - Sort parameter for initial fetch (e.g., '-created')
  - **filter**: `string` - Filter parameter for initial fetch (e.g., 'status = "active"')
  - **expand**: `string` - Expand parameter for initial fetch (e.g., 'author,comments')
- **id**: `string` - Collection identifier (optional)
- **schema**: `StandardSchemaV1` - Schema validation (optional)

## Advanced Usage

### With Authentication

```typescript
await pb.collection('users').authWithPassword('user@example.com', 'password')

const privateNotes = createCollection(
  pocketbaseCollectionOptions<Note>({
    client: pb,
    collectionName: 'private_notes',
    getKey: (item) => item.id,
  })
)
```

### With Data Transformation

```typescript
interface LocalTodo {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
}

const todos = createCollection(
  pocketbaseCollectionOptions<LocalTodo>({
    client: pb,
    collectionName: 'todos',
    getKey: (item) => item.id,
    parse: {
      createdAt: (timestamp: string) => new Date(timestamp),
      updatedAt: (timestamp: string) => new Date(timestamp),
    },
    serialize: {
      createdAt: (date: Date) => date.toISOString(),
      updatedAt: (date: Date) => date.toISOString(),
    },
  })
)
```

### With Initial Fetch Options

```typescript
const recentTodos = createCollection(
  pocketbaseCollectionOptions<Todo>({
    client: pb,
    collectionName: 'todos',
    getKey: (item) => item.id,
    initialFetchOptions: {
      sort: '-created',
      filter: 'created >= @todayStart',
      expand: 'author',
    },
  })
)
```

### Using Collection Utilities

```typescript
const todos = createCollection(
  pocketbaseCollectionOptions<Todo>({
    client: pb,
    collectionName: 'todos',
    getKey: (item) => item.id,
  })
)

console.log(todos.utils.isSubscribed())

todos.utils.cancel()
```

## How It Works

### Initial Sync

1. Fetches all records from PocketBase using `getFullList()`
2. Transforms records using `parse` functions (if provided)
3. Writes records to local collection
4. Marks collection as ready

### Real-time Updates

1. Subscribes to PocketBase collection changes using SSE
2. Buffers events during initial sync to prevent race conditions
3. Processes buffered events after initial sync completes
4. Applies real-time updates (create/update/delete) to local collection

### Mutations

When you modify the local collection, mutations are:

1. Validated for correct type
2. Transformed using `serialize` functions (if provided)
3. Sent to PocketBase
4. Tracked until confirmed via subscription
5. Timeout error thrown if not confirmed within `mutationTimeout`

## Error Types

- **PocketBaseDBCollectionError**: Base error class
- **TimeoutWaitingForIdsError**: Mutation confirmation timeout
- **ExpectedInsertTypeError**: Invalid insert mutation type
- **ExpectedUpdateTypeError**: Invalid update mutation type
- **ExpectedDeleteTypeError**: Invalid delete mutation type
- **SubscriptionError**: Subscription-related errors

## API Reference

### pocketbaseCollectionOptions<TItem>(config)

Creates a collection configuration object for TanStack DB.

**Type Parameters:**
- `TItem extends object` - The type of items in the collection

**Returns:**
- `CollectionConfig<TItem> & { utils: PocketBaseCollectionUtils }`

### PocketBaseCollectionUtils

**Methods:**
- `cancel(): void` - Unsubscribe from real-time updates
- `isSubscribed(): boolean` - Check if currently subscribed

## Comparison with Other Collections

| Feature | PocketBase Collection | Query Collection | Electric Collection |
|---------|----------------------|------------------|---------------------|
| Real-time Sync | ✅ SSE | ❌ | ✅ WebSocket |
| Offline Support | ❌ | ❌ | ✅ |
| Authentication | ✅ Built-in | Manual | Manual |
| Auto-reconnect | ✅ | N/A | ✅ |
| Backend Required | PocketBase | Any API | Electric |

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Links

- [TanStack DB Documentation](https://tanstack.com/db)
- [PocketBase Documentation](https://pocketbase.io/docs/)
- [GitHub Repository](https://github.com/yourusername/pocketbase-db-collection)
