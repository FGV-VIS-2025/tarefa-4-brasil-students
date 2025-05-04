import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  // debe coincidir con tu repo name
  base: '/tarefa-4-brasil-students/',

  plugins: [ svelte() ],

  build: {
    outDir: 'docs'      // opcional: para servir desde /docs en main
  }
})
