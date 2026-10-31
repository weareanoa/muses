# Plan 001: De-slop the contact card in ContactSection

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 4b085a4..HEAD -- src/components/sections/ContactSection.astro`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction (visual design / UX copy)
- **Planned at**: commit `4b085a4`, 2026-10-31

## Why this matters

The contact card at the bottom of the home page and the /kontak page looks
like a generic AI template: a pale beige rounded card identical in shape to
the store card, a gold gradient button identical to every other button, a
mail icon inside a circle inside a circle, three identical icon-circle social
rows, and the headline "Your Next Collaboration Starts Here." plus
"for official business inquiries only." — vague copy that says nothing
specific about who to contact, how, or for what. A business contact block
should do the opposite: name the person, show the address, and state exactly
what it is for. After this plan, the same facts are presented as an editorial
layout with no beige card, no icon circles, and a visible, copyable email.

## Current state

- File: `src/components/sections/ContactSection.astro` — the only file in
  scope. It renders the gold gradient banner at the top (leave untouched)
  and then the beige contact card below it (replace only the card).
- Used by exactly two pages, so one edit fixes both:
  - `src/pages/index.astro:10,31` — `<ContactSection />`
  - `src/pages/kontak.astro:5,14` — `<ContactSection />`
- Card wrapper today (do not copy this shape):
  - `<div class="bg-[#FAF3E3] border border-[#E7D6AF] rounded-3xl sm:rounded-[32px] p-6 sm:p-10 lg:p-12 shadow-[0_4px_25px_rgba(201,151,28,0.06)]">`
  - Grid: `grid grid-cols-1 lg:grid-cols-12`, left `lg:col-span-7`, a
    vertical divider `w-px h-28 bg-[#D8C496]`, right `lg:col-span-4`.
- Mail icon today: a `w-16 h-16` pale circle containing a `w-11 h-11`
  gold circle containing an envelope SVG. Delete both circles.
- Headline today: `Your Next Collaboration Starts Here.` with subcopy
  `for official business inquiries only.` Delete both strings.
- Button today: gold gradient `Contact (Dania)`, href
  `mailto:dania@muses.id?subject=Collaboration%20Inquiry%20-%20MUSES`.
  Keep the exact mailto href; change the label and the styling.
- Social rows today: Instagram, TikTok (labelled `Tiktok`), YouTube, each
  a pale icon circle + bold platform name + `@muses.official`, hrefs
  `https://instagram.com/muses.official`,
  `https://tiktok.com/@muses.official`,
  `https://youtube.com/@muses.official`. Keep all three hrefs and the
  handle exactly; change only the presentation.
- Verified facts you may use (nothing else may be claimed):
  - Contact person: Dania. Email: `dania@muses.id`.
  - Purposes, from the banner copy above the card: business inquiries,
    collaborations, event partnerships.
  - Social handle on all three platforms: `@muses.official`.
- Repo conventions: Astro + Tailwind v4, brand tokens already in use in
  this file — ivory `#FCFAF5`, ink `#1F1A12`, gold `#C9971C`, muted
  `#5C4F39`. No new dependencies, no new images, no new global CSS.
  Verification in this repo is build + deploy + live curl (there is no
  test suite; do not invent one).

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Build | `npm run build` (in `~/muses`) | exit 0, `Complete!` |
| Deploy | `npx wrangler deploy` (in `~/muses`) | `Deployed muses`, URL `https://muses.weareanoa.workers.dev` |
| Live check | `curl -s https://muses.weareanoa.workers.dev/ -o /tmp/home.html -w "%{http_code}"` and same for `/kontak` | `200` for both |

## Scope

**In scope** (the only file you should modify):
- `src/components/sections/ContactSection.astro` — the card below the banner only.

**Out of scope** (do NOT touch, even though they look related):
- The gold gradient banner at the top of the same file (headline
  `Let’s Create Something Beautiful Together` + group image).
- `src/components/sections/FooterCTA.astro` — it also links the same socials
  and email; this plan is about the contact card only.
- Any social URL, the handle `@muses.official`, the email address, or the
  mailto subject — presentation changes only, facts unchanged.
- `src/styles/global.css`, any new animation/reveal, any new dependency.
- The section wrapper id `kontak` and `data-section="kontak"`.

## Git workflow

- Working tree already has uncommitted work on `main`; do NOT commit, push,
  or create a worktree from HEAD — a clean worktree would lose that work.
  Edit the working tree only and leave commit/push to the operator.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Replace the beige card with an editorial layout

Delete the card wrapper div quoted in "Current state" and the grid,
divider, and icon circles inside it. Replace the whole card block with:
a plain section on the existing ivory background, a top hairline rule
(`border-t border-[#1F1A12]/15`), and an asymmetric grid
(`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14`), left
`lg:col-span-7`, right `lg:col-span-5`, no vertical divider, no card
background, no card border, no card shadow.

**Verify**: `grep -n "bg-\[#FAF3E3\]" src/components/sections/ContactSection.astro` returns no match in the card block (the banner uses a gradient, not this class).

### Step 2: Write specific contact copy, show the email

Left column, in order:
1. Small label: `MANAGEMENT — BOOKINGS & PARTNERSHIPS` (keep the existing
   `text-[11px] font-semibold tracking-[0.2em] uppercase text-[#8E6D24]` style).
2. Headline (existing bold Poppins style, `text-3xl sm:text-4xl font-bold
   leading-tight tracking-tight`): `Bookings, partnerships, and press — talk to management.`
3. One sentence reusing only verified purposes: `For business inquiries,
   collaborations, and event partnerships, write to Dania at MUSES management.`
4. The email as visible, selectable text AND a link, same mailto href as
   before: `dania@muses.id`, styled `text-lg sm:text-xl font-bold` with a
   gold underline (`underline decoration-[#C9971C] underline-offset-4`)
   and `break-all` so it wraps on small phones.
5. One advice line (flagged: this is new UX advice copy, not a stated
   management policy — the operator may correct it): `It helps to include
   the event date and city, the type of collaboration, and your timeline.`
6. Button, solid ink instead of gold gradient:
   `bg-[#1F1A12] text-[#FCFAF5]`, label `Write to Dania`, arrow `↗`,
   same mailto href as before.

**Verify**: `grep -n "dania@muses.id" src/components/sections/ContactSection.astro` shows the address both as link text and in the href; `grep -n "Your Next Collaboration Starts Here" src/components/sections/ContactSection.astro` returns no match.

### Step 3: Turn socials into a hairline text list

Right column, in order:
1. Small label, same style as Step 2.1: `FOLLOW MUSES`.
2. A list with hairline separators (`divide-y divide-[#1F1A12]/10`,
   top and bottom border). Each row is one link, full width, with the
   platform name on the left and `@muses.official ↗` on the right. No icon
   circles, no icon SVGs, no bold duplication. Correct the old `Tiktok`
   label to `TikTok`. Keep all three hrefs exactly as in "Current state".

**Verify**: `grep -n "instagram.com/muses.official|tiktok.com/@muses.official|youtube.com/@muses.official" src/components/sections/ContactSection.astro` shows all three hrefs; `grep -n "Tiktok" src/components/sections/ContactSection.astro` returns no match.

### Step 4: Build, deploy, verify live

Run the build, then deploy, then curl `/` and `/kontak`. In the live
home HTML, confirm: the new headline is present, the old headline is
absent, the email appears as text, and all three social hrefs are present.

**Verify**: build exit 0; deploy prints the workers.dev URL; both curls
return `200`; `grep -c "Bookings, partnerships" /tmp/home.html` is >= 1.

## Test plan

This repo has no test suite, so verification is the build + live checks
in Steps 1–4. Additionally, visually check the live section on a phone
width (stacked, email wraps, no horizontal overflow) and a desktop width
(asymmetric 7/5 columns, no divider). Do not add a test framework for
this plan.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run build` exits 0
- [ ] No `bg-[#FAF3E3]` card wrapper remains in ContactSection.astro
- [ ] `Your Next Collaboration Starts Here` appears nowhere in ContactSection.astro
- [ ] `dania@muses.id` appears as visible link text, not only inside an href
- [ ] All three social hrefs unchanged; `Tiktok` corrected to `TikTok`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] Live `/` and `/kontak` return `200` with the new headline present
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts
  (the codebase has drifted since this plan was written).
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.
- The contact person, email, or social handles turn out to be different
  from the verified facts above.

## Maintenance notes

- Future contact-person changes touch this one file only, because both
  the home page and /kontak render it.
- If management later adds a response-time promise or a press kit link,
  add it as a plain text line in the left column — do not reintroduce a
  card, icon circles, or a second headline for it.
- Deferred out of this plan on purpose: the gold banner above the card
  (its headline is also generic, but changing it is a separate visual
  decision, not part of this card fix).
