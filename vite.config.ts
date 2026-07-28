import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

const base = process.env.NETLIFY === 'true'
  ? '/'
  : process.env.GITHUB_ACTIONS
    ? '/library-borrow-system/'
    : '/library/';

export default defineConfig({
  base,
  build: {
    sourcemap: 'hidden',
    modulePreload: { polyfill: false },
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    tsconfigPaths(),
    {
      name: 'remove-crossorigin',
      transformIndexHtml(html) {
        return html.replace(/ crossorigin/g, '');
      },
    },
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://seven-website-8gwpkoon2ce77ee5.tcloudbaseapp.com',
        changeOrigin: true,
      },
    },
  },
})
