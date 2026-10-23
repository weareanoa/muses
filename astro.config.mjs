import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

const base = process.env.BASE_PATH ? process.env.BASE_PATH.replace(/\/$/, '') : '/';

export default defineConfig({
  base,
  site: process.env.SITE_URL || undefined,
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});