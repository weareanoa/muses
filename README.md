# MUSE — Artist Showcase & Store Template

A white-and-gold music artist showcase skeleton built with Astro 7, React islands, Tailwind CSS v4, nanostores, GSAP and Lenis. All content, images and copy are placeholders — replace them with your own artist data.

## Stack

- **Astro** — static pages and routing
- **React islands** — interactive sections (turntable player, store, auth, checkout)
- **Tailwind CSS v4** — utility styling via `@tailwindcss/vite`
- **nanostores** — cart and auth state
- **GSAP + Lenis** — preloader, parallax and pinned horizontal scroll
- **lucide-react** — icon set

## Project structure

```text
/
├── public/
│   ├── audio/preview.wav
│   ├── favicon.svg
│   └── images/            # generated placeholder SVGs
├── scripts/
│   └── generate-placeholders.mjs
├── src/
│   ├── components/
│   │   ├── islands/       # React interactive components
│   │   ├── sections/      # Astro page sections
│   │   └── ui/            # shared primitives
│   ├── data/              # members, discography, products, schedules
│   ├── layouts/RootLayout.astro
│   ├── pages/
│   ├── stores/            # authStore, cartStore
│   └── styles/global.css
├── astro.config.mjs
└── package.json
```

## Commands

| Command           | Action                                      |
| :---------------- | :------------------------------------------ |
| `npm install`     | Install dependencies                        |
| `npm run dev`     | Start dev server at `localhost:4321`        |
| `npm run build`   | Build production site to `./dist/`          |
| `npm run preview` | Preview the production build                |
| `npm run astro`   | Run Astro CLI commands                      |

## Regenerating placeholder assets

```sh
node scripts/generate-placeholders.mjs
```

The script rewrites every SVG in `public/images`, the audio preview and `public/favicon.svg` using the theme palette.

## Customising the template

1. **Content** — edit `src/data/*.json` (members, discography, products, schedules).
2. **Branding** — search for `MUSE`, `GOLDEN HOUR`, `CIRCLE` and `AUREUM RECORDS` in `src`.
3. **Palette** — update the CSS variables in `src/styles/global.css` and the hard-coded hex values in components.
4. **Assets** — drop real photos into `public/images` and point the JSON `photo*` / `coverImage` / `image` fields at them.
5. **Auth demo** — the seeded demo users live in `src/stores/authStore.ts`.

## Theme palette

| Token        | Hex       | Usage                    |
| :----------- | :-------- | :----------------------- |
| Ivory        | `#FCFAF5` | Page background          |
| Sand         | `#F8F5EC` | Section background       |
| Surface      | `#FFFFFF` | Cards and panels         |
| Ink          | `#1F1A12` | Primary text             |
| Deep gold    | `#9A7420` | Primary accent, buttons  |
| Medium gold  | `#B08A36` | Hover / secondary accent |
| Bright gold  | `#C9A227` | Active states, highlights|
| Pale gold    | `#E9D9AE` | Borders, muted accents   |

## Notes

- Data is stored in `localStorage` under the `muse_*` keys.
- The checkout is a UI demo only: no payment gateway is connected.
