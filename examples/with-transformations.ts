import { createCollection } from '@tanstack/db'
import { pocketbaseCollectionOptions } from '@gdenier/pocketbase-db-collection'
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')

interface LocalTodo {
  id: string
  title: string
  completed: boolean
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

todos.subscribe((state) => {
  console.log('Todos with Date objects:', state.items)
  state.items.forEach((todo) => {
    console.log(`${todo.title} - Created: ${todo.createdAt.toLocaleDateString()}`)
  })
})

async function main() {
  const now = new Date()

  todos.insert({
    id: '',
    title: 'Task with date transformations',
    completed: false,
    createdAt: now,
    updatedAt: now,
  })
}

main().catch(console.error)
