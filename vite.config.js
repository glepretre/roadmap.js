import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/roadmap.js'),
      name: 'RoadmapGen',
      fileName: 'roadmap',
      formats: ['es', 'umd']
    }
  }
})
