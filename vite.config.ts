import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts({ rollupTypes: true })],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PocketBaseDBCollection',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['@tanstack/db', '@tanstack/store', 'pocketbase', '@standard-schema/spec'],
      output: {
        globals: {
          '@tanstack/db': 'TanStackDB',
          '@tanstack/store': 'TanStackStore',
          'pocketbase': 'PocketBase',
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
})
