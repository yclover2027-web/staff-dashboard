import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pagesで真っ白な画面になるのを防ぐための設定
  base: './', 
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html'
      }
    }
  }
})
