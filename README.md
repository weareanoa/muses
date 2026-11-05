# MUSES — Official Site & Store

Astro 7 + React islands + Tailwind v4. Idol-group profile + store for MUSES.
Live at https://muses.id (Cloudflare Workers, `muses` worker).

## Deploy

Production auto-deploys on every push to `main` via
`.github/workflows/deploy-production.yml`: build check (also runs on pull
requests) → `wrangler deploy` → live route + content verification.

Manual deploy from tuf: `npm run build && npx wrangler deploy`

## Database migrations (Supabase)

Apply new migration files FIRST in the Supabase dashboard SQL editor, THEN
push the code that depends on them. Deploying code against an un-migrated
database breaks checkout (Nov 2026: an empty `products` table made every
order fail with `UNKNOWN_PRODUCT` while the cart looked stuck).

## GitHub Actions secrets

Repo Settings → Secrets and variables → Actions:

- `CLOUDFLARE_API_TOKEN` — Cloudflare API token, "Edit Cloudflare Workers" template
- `CLOUDFLARE_ACCOUNT_ID`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
