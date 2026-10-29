import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

const base = process.env.BASE_PATH ? process.env.BASE_PATH.replace(/\/$/, '') : '/';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  base,
  site: process.env.SITE_URL || undefined,
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});
