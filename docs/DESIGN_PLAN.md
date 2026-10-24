# TestHub — UI Beautification Plan

## Reference images analysed
| File | App | Key signal |
|---|---|---|
| `image.png` | Snowflake | Clean enterprise platform: left nav with sections, search-first, quick-action grid |
| `image copy.png` | Hilos | Warm internal hub: cream bg, bold personalised welcome, colourful stat chips |
| `image copy 2.png` | Reddit Insights | Grouped sidebar sections, stat overview row, clean data tables |
| `image copy 3.png` | Mora Analytics | Minimal AI-era light bg, strong type hierarchy |
| `image copy 4.png` | Dovetail | Dark hero, "single source of truth" — mission-aligned with TestHub |
| `Pasted 22-10-2026` | Coinview | **Dark sidebar + clean white content, pastel metric cards, bold table rows** |

## Design direction

The references cluster around a consistent vision:
- Dark charcoal sidebar (not pure white in light mode)
- Clean white/off-white content area with subtle decorative bg (already exists)
- Colorful pastel stat cards with large bold numbers
- Personalised "Welcome back, [name]" dashboard header
- Feature cards with status accent stripe (pending/approved/draft)

## What's already good (keep)
- Font stack: Chivo (headings) + IBM Plex Sans (body) + JetBrains Mono (code) — excellent
- Indigo primary colour — works well
- Dark mode support and SVG background art in content area
- Overall sidebar + content layout structure

---

## Change set

> Dark mode note: the existing app already has a working light/dark toggle in the sidebar footer.
> Every change below specifies both light and dark Tailwind classes — no extra mechanism needed.

### 1 — Sidebar overhaul (`Layout.jsx`)
**Goal:** Flip from white to charcoal sidebar in both light AND dark mode (Coinview/Snowflake pattern).
Dark sidebars read as "platform", white sidebars read as "admin panel".

| Element | Light | Dark |
|---|---|---|
| Sidebar bg | `bg-zinc-900` | `dark:bg-zinc-950` |
| Sidebar border | `border-zinc-800` | `dark:border-zinc-800` (same) |
| Nav text default | `text-zinc-400` | `dark:text-zinc-500` |
| Nav text hover | `hover:text-zinc-100` | same |
| Nav active bg | `bg-zinc-800` | `dark:bg-zinc-800` (same) |
| Nav active text | `text-indigo-400` | `dark:text-indigo-400` (same) |
| Active left border | `border-indigo-500` | same |
| Brand text | `text-zinc-50` | same |
| Quick Add button | `bg-indigo-600 hover:bg-indigo-700` | same |
| User email / role | `text-zinc-500` | same |
| Section label (ADMIN) | `text-zinc-600` | same |

### 2 — Dashboard personalised header (`Dashboard.jsx`)
**Goal:** Hilos-inspired warm welcome with user name.

| Element | Light | Dark |
|---|---|---|
| Eyebrow label | `text-indigo-400` | `dark:text-indigo-400` (same) |
| H1 "Welcome back, [name]" | `text-zinc-900` | `dark:text-zinc-100` |
| Subtitle | `text-zinc-500` | `dark:text-zinc-400` |

### 3 — Colorful stat cards (`Dashboard.jsx`)
**Goal:** Hilos/Coinview-style pastel stat cards instead of plain white boxes.

| Card | Light bg / border / number | Dark bg / border / number |
|---|---|---|
| Features | `bg-indigo-50 border-indigo-200 text-indigo-700` | `dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300` |
| Contributors | `bg-emerald-50 border-emerald-200 text-emerald-700` | `dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300` |
| Tags | `bg-amber-50 border-amber-200 text-amber-700` | `dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300` |
| Icon container | matches card | matches dark card |

### 4 — Feature list status accent (`Features.jsx`)
**Goal:** Scan status at a glance via a 3px left-border stripe on each row.

| Status | Light border | Dark border |
|---|---|---|
| `pending_review = true` | `border-l-4 border-l-amber-400` | `dark:border-l-amber-500` |
| approved | `border-l-4 border-l-emerald-400` | `dark:border-l-emerald-500` |
| default / draft | `border-l-4 border-l-zinc-200` | `dark:border-l-zinc-700` |

### 5 — Typography & spacing polish (global)
**Goal:** Better use of existing Chivo + IBM Plex stack.

| Element | Change |
|---|---|
| Page H1 | `text-4xl md:text-5xl` (currently `text-3xl md:text-4xl`) |
| Eyebrow mono labels | add `tracking-[0.15em]` (currently `tracking-widest`) |
| Feature row card | increase padding `p-5` → `p-5 py-4` |

---

## Files to change
| File | Change |
|---|---|
| `frontend/src/components/Layout.jsx` | Dark sidebar |
| `frontend/src/pages/Dashboard.jsx` | Welcome header + colourful stat cards |
| `frontend/src/pages/Features.jsx` | Status accent stripe on feature rows |
| `frontend/src/index.css` | Any global token adjustments if needed |

## What this does NOT change
- Any backend logic
- Auth or role system
- Feature data model
- Import, QA Actions, Admin pages (can be revisited in round 2)

## Estimated effort
~2–3 hours of focused frontend work. All changes are additive Tailwind class swaps — no new dependencies, no schema changes.

## Round 2 candidates (after V1 launch)
- Animated stat card counters
- Feature card hover micro-animation
- Dashboard activity feed with colour-coded action types
- Onboarding empty-state illustration
