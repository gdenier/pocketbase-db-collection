import { createCollection } from '@tanstack/db'
import { pocketbaseCollectionOptions } from '@gdenier/pocketbase-db-collection'
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')

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

todos.subscribe((state) => {
  console.log('Todos:', state.items)
})

async function main() {
  await pb.collection('users').authWithPassword('test@example.com', 'password123')

  todos.insert({
    id: '',
    title: 'Buy groceries',
    completed: false,
    created: '',
    updated: '',
  })

  todos.insert({
    id: '',
    title: 'Write documentation',
    completed: true,
    created: '',
    updated: '',
  })

  setTimeout(() => {
    const firstTodo = todos.getState().items[0]
    if (firstTodo) {
      todos.update(firstTodo.id, { completed: true })
    }
  }, 2000)

  setTimeout(() => {
    const secondTodo = todos.getState().items[1]
    if (secondTodo) {
      todos.delete(secondTodo.id)
    }
  }, 4000)
}

main().catch(console.error)
