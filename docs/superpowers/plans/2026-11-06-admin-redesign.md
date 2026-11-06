# MUSES Admin Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the MUSES admin UI from scratch to replace dated, cluttered, and slop UI with a high-craft modern dashboard interface inspired by the OFSPACE financial dashboard reference (clean persistent sidebar, refined KPI cards, structured data tables, and cohesive design tokens), while fixing underlying runtime i18n crashes.

**Architecture:** Replace the legacy top-tab `AdminShell` and rogue per-island styling with a unified left-sidebar + top-header application shell (`AdminShell.tsx`), a modernized design system (`ui.tsx`) using crisp neutral tokens (`zinc-50/zinc-100/zinc-200`) and subtle MUSES gold accents, an OFSPACE-inspired overview dashboard (`AdminHomeIsland.tsx`), and clean full-width page containers in Astro.

**Tech Stack:** Astro 7.4, React 19, Tailwind CSS 4, Lucide React, Supabase JS, TypeScript.

---

### Task 1: i18n Dictionary Fix & Admin Navigation Keys

**Files:**
- Modify: `src/i18n/dictionary.ts`

**Interfaces:**
- Consumes: `idAdmin`, `enAdmin`
- Produces: `d.admin.nav`, `d.admin.home` with complete localized labels for overview, orders, schedules, store, settings, KPIs, and quick actions.

- [ ] **Step 1: Inspect missing admin keys in `dictionary.ts`**
Verify current dictionary output for `getDict('id').admin.nav` and `getDict('id').admin.home`.

- [ ] **Step 2: Add complete `nav` and `home` objects to `idAdmin.admin` and `enAdmin.admin`**
Include:
- `nav`: `overview`, `orders`, `schedules`, `store`, `settings`, `viewSite`, `signOut`, `tag`, `aria`, `menu`, `system`
- `home`: `title`, `manageStore`, `kpiSchedules`, `kpiAvailable`, `kpiFast`, `kpiCatalog`, `kpiDefaultCode`, `kpiFeatured`, `kpiVerify`, `kpiVerifyHint`, `kpiAccess`, `kpiAccessValue`, `schedulesCardSub`, `emptySchedules`, `schedulesFooter`, `openSchedules`, `recentOrders`, `recentOrdersSub`, `viewAllOrders`, `quickActions`, `catalogHealth`

- [ ] **Step 3: Verify with Node script that dictionary keys resolve without error**
Run: `node -e "import('./src/i18n/dictionary.ts').then(m => { console.log(m.getDict('id').admin.nav.overview, m.getDict('en').admin.nav.overview); })"`
Expected: Outputs "Ringkasan" and "Overview" (or equivalent translations) without `undefined` errors.

---

### Task 2: High-Craft Admin UI Kit (`src/components/admin/ui.tsx`)

**Files:**
- Modify: `src/components/admin/ui.tsx`

**Interfaces:**
- Produces: `AdminButton`, `AdminCard`, `AdminSectionCard`, `AdminStatCard`, `AdminInput`, `AdminTextarea`, `AdminSelect`, `AdminToggle`, `AdminField`, `AdminStatusPill`, `AdminNotice`, `EmptyState`, `ConfirmButton`.

- [ ] **Step 1: Modernize design tokens and base styles**
Replace dirty yellow borders (`#E9D9AE`) and muddy backgrounds (`#FCFAF5`) with crisp zinc neutrals (`bg-white`, `border-zinc-200/80`, `text-zinc-900`, `text-zinc-500`) and refined focus rings (`focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900`).

- [ ] **Step 2: Build `AdminStatCard` component**
Provide an elegant KPI card matching the OFSPACE design: title label, large crisp numeric metric, icon container, optional delta/sub-pill or hint.

- [ ] **Step 3: Modernize `AdminStatusPill` and `AdminButton`**
Refine pill tones with soft pastel backgrounds and high-contrast typography (Emerald for `completed`/`available`, Amber for `awaiting_verification`/`selling_fast`, Rose for `rejected`/`cancelled`, Zinc for neutral). Provide button variants (`primary`, `secondary`, `gold`, `danger`, `ghost`).

- [ ] **Step 4: Verify build with `npm run build`**

---

### Task 3: Modern Left-Sidebar Application Shell (`src/components/admin/AdminShell.tsx`)

**Files:**
- Modify: `src/components/admin/AdminShell.tsx`

**Interfaces:**
- Produces: `<AdminShell currentTab={...} adminEmail={...} locale={...} title={...} subtitle={...} actions={...}>{children}</AdminShell>`

- [ ] **Step 1: Create responsive sidebar layout**
Implement desktop persistent sidebar (`w-64 shrink-0 bg-white border-r border-zinc-200/80`) and mobile slide-out drawer with backdrop.

- [ ] **Step 2: Build sidebar navigation structure**
- Brand header: MUSES 3D logo + "ADMIN" badge.
- Navigation section 1 (Main Menu): Overview (`LayoutDashboard`), Orders (`ShoppingBag` / `Receipt` + pending count badge), Tour Schedules (`CalendarDays`), Store Catalog (`Package`).
- Navigation section 2 (System & Site): Settings (`Settings`), View Public Site (`ExternalLink`).
- Footer: Admin avatar circle with email display and direct Sign Out button.

- [ ] **Step 3: Build top header bar and main content wrapper**
Top bar with page title, subtitle, contextual actions, mobile menu button, and clean fluid scroll area for children.

- [ ] **Step 4: Verify build with `npm run build`**

---

### Task 4: Redesign Overview Dashboard (`src/components/islands/AdminHomeIsland.tsx`)

**Files:**
- Modify: `src/components/islands/AdminHomeIsland.tsx`

**Interfaces:**
- Produces: Redesigned Admin Overview matching OFSPACE inspiration.

- [ ] **Step 1: Wire real Supabase data & stats**
Query recent transactions (last 6 transactions with customer name, amount, items, status), upcoming schedules, catalog product counts, and pending verification counts.

- [ ] **Step 2: Build 4 KPI summary cards at top**
- Pending Orders (with count and urgent badge if > 0).
- Tour Schedules (with available/fast counts).
- Catalog Inventory (with featured product count).
- Admin Session status (with verified email badge).

- [ ] **Step 3: Build main 2-column layout**
- Left/Primary (2/3 width): Recent Orders Table with customer name, order date, amount formatted in IDR, status pill, and direct link to review in `/admin/orders`.
- Right/Secondary (1/3 width):
  - Next Upcoming Tour Schedule card with venue, date countdown, and direct edit link.
  - Quick operations panel (shortcuts to Add Schedule, Add Product, Settings).

- [ ] **Step 4: Verify build with `npm run build`**

---

### Task 5: Refactor Astro Page Wrappers (`src/pages/admin/*.astro`)

**Files:**
- Modify: `src/pages/admin/index.astro`
- Modify: `src/pages/admin/orders.astro`
- Modify: `src/pages/admin/schedules.astro`
- Modify: `src/pages/admin/store.astro`
- Modify: `src/pages/admin/settings.astro`
- Modify: `src/pages/admin/login.astro`

**Interfaces:**
- Ensure full-width, clean viewport styling without artificial constricted containers (`max-w-7xl pt-8 pb-12 mx-auto bg-[#FCFAF5]`).

- [ ] **Step 1: Update each page in `src/pages/admin/*.astro`**
Remove restrictive container divs and double backgrounds so `AdminShell` renders flush with the viewport.

- [ ] **Step 2: Verify build with `npm run build`**

---

### Task 6: Unify Sub-Pages into the New Admin Experience

**Files:**
- Modify: `src/components/islands/AdminScheduleIsland.tsx`
- Modify: `src/components/islands/AdminStoreIsland.tsx`
- Modify: `src/components/islands/AdminOrdersIsland.tsx`
- Modify: `src/components/islands/AdminSettingsIsland.tsx`
- Modify: `src/components/admin/AdminGate.tsx`
- Modify: `src/components/islands/AdminLoginIsland.tsx`

- [ ] **Step 1: Wrap `AdminScheduleIsland.tsx` in `AdminShell` and new UI components**
Replace rogue custom styling, yellow borders, and duplicate back buttons with `AdminShell currentTab="schedules"`, clean schedule data table/cards, and modernized form modal.

- [ ] **Step 2: Wrap `AdminStoreIsland.tsx` in `AdminShell` and new UI components**
Replace rogue custom styling with `AdminShell currentTab="store"`, clean category filter pills, product grid/table with image thumbnails, and polished product edit form.

- [ ] **Step 3: Modernize `AdminOrdersIsland.tsx` and `AdminSettingsIsland.tsx`**
Refine order status tabs, verification modal, and settings cards to match the new crisp zinc & gold design language.

- [ ] **Step 4: Modernize `AdminGate.tsx` and `AdminLoginIsland.tsx`**
Ensure login and access gate screens use the clean modern card aesthetics with clear feedback.

---

### Task 7: Full Verification & Sanity Check

- [ ] **Step 1: Run production build `npm run build`**
- [ ] **Step 2: Verify no TypeScript, runtime syntax, or SSR errors**
