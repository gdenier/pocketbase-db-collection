import { createCollection } from '@tanstack/db'
import { pocketbaseCollectionOptions } from '@gdenier/pocketbase-db-collection'
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')

interface Todo {
  id: string
  title: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  created: string
  updated: string
}

const highPriorityTodos = createCollection(
  pocketbaseCollectionOptions<Todo>({
    client: pb,
    collectionName: 'todos',
    getKey: (item) => item.id,
    initialFetchOptions: {
      filter: 'priority = "high" && completed = false',
      sort: '-created',
      expand: 'user',
    },
  })
)

highPriorityTodos.subscribe((state) => {
  console.log('High priority incomplete todos:', state.items.length)
  state.items.forEach((todo) => {
    console.log(`- ${todo.title} (${todo.priority})`)
  })
})

const recentTodos = createCollection(
  pocketbaseCollectionOptions<Todo>({
    client: pb,
    collectionName: 'todos',
    getKey: (item) => item.id,
    initialFetchOptions: {
      filter: 'created >= @todayStart',
      sort: '-created',
    },
  })
)

recentTodos.subscribe((state) => {
  console.log('Today\'s todos:', state.items.length)
})
