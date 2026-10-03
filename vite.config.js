import { defineConfig } from 'vite';

// GitHub Pages 会部署到 https://<user>.github.io/card-lab/，
// 因此所有资源必须使用相对路径。
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
  },
  server: {
    port: 5178,
    open: false,
  },
});
