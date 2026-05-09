import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/lost-ark-tool/', // 👈 這是對應你之後在 GitHub 上的專案名稱
  build: {
    outDir: 'docs'         // 👈 讓打包檔案輸出到 docs 資料夾，而不是預設的 dist
  }
})