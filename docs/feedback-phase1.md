# Phase 1 Feedback — 2026-04-03

Captured from first live walkthrough. Ranked by priority.

---

## P0 — Fix before using daily

### 1. Slot assignment UX is too slow
> "I don't want to have to tab to quick text. That needs to be super fast and have high ergonomics."

The recipe/quick-text toggle adds friction. Should be a single input that searches recipes and lets you type freeform in the same flow. If no recipes match, show a "just add [text] as-is" option inline. Leftovers should be a pre-canned quick option, not a separate mode.

**Proposed fix:** Unified search input. Type → search recipes → if no match, offer "Add as quick meal" and "Mark as leftovers" buttons below. No tabs, no mode switching.

### 2. Recipe save appears broken (hangs on submit)
> "Saving a recipe makes it seem like it breaks. It hangs. But it actually does save."

The form submits but doesn't give feedback or navigate away cleanly. Likely the `router.push` after create isn't resolving quickly, or there's a race with Convex reactivity.

**Proposed fix:** Optimistic navigation — redirect immediately after mutation returns. Add a toast/subtle confirmation so the user knows it worked.

### 3. Undo/redo for slot removal
> "There should be a way to undo/redo when removing recipes. Could be a pain if done accidentally."

One-tap delete with no escape hatch is risky, especially on mobile where mis-taps happen. Ctrl+Z is nice for desktop but not sufficient.

**Proposed fix:** Replace immediate delete with a toast-style "Removed [meal] — Undo" notification that persists for ~5 seconds. The actual deletion is deferred until the toast expires. Works on both desktop and mobile.

### 4. Performance / loading states
> "It's not super performant. There's a lot of loading states. I want it to feel super fast and modern."

Multiple loading spinners on page load (auth check, user query, meal plans query, recipe queries per slot). Each waterfall step adds perceived latency.

**Proposed fix:**
- Prefer minimal inline loading (short copy) over full-page skeleton chrome; keep nav stable
- Prefetch meal plan data in the layout
- Batch recipe name lookups instead of per-slot queries
- Consider `Suspense` boundaries to stream content progressively
- Ensure Convex queries are properly indexed (they are, but verify query plans)

**Shipped (2026-04-03):** Batched `recipes.getNamesByIds`; plan grid always renders real columns (no skeleton on paging). App shell keeps **Scran** + Plan/Recipes as real links (`next/link` for client nav); `UserButton` once Clerk session is ready. Recipe list/detail: one-line loading copy. Slot recipe titles: quiet `…` until names resolve. Follow-ups: layout prefetch for date range, Suspense/streaming if we add RSC boundaries.

---

## P1 — Important but not blocking daily use

### 5. Sign out + display name
> "The user account should have a way to sign out, and only show the user's first name."

Nav bar shows full `displayName` with no sign-out option. Needs a user menu.

**Proposed fix:** Small dropdown on the user name — show first name only, with sign-out option. Clerk's `<UserButton />` component may handle this out of the box.

**Shipped:** Nav shows **avatar only** (`<UserButton />`); no adjacent name text. Account menu still exposes profile and sign-out.

### 6. No theme selector
> "There's no theme selector yet."

Currently follows system preference via Tailwind's dark mode. No manual toggle.

**Proposed fix:** Add light/dark/system toggle in settings or nav. Store preference in household settings or localStorage. Low effort, nice polish.

**Shipped:** Segmented **Light / System / Dark** control in app nav; compact floating toggle on auth routes (`(auth)/layout`). Preference in `localStorage` key `scran-theme`. Tailwind `dark:` uses class `dark` on `<html>` (`@custom-variant` in `globals.css`); inline boot script avoids flash.

---

## P2 — Later / Phase 2+

### 7. Shopping list
> "Confirming there's no shopping list option yet?"

Correct — explicitly scoped out of Phase 1. Schema supports it. Phase 2 feature per the PRD.

### 8. Start cooking mode
> "We'll need to develop a better 'start cooking mode' eventually on the recipe details."

Phase 3 per PRD (step-by-step cooking mode). Data model already captures steps with duration. Will need a focused, large-text, swipeable UI.

### 9. Recipe images
> "We may want to add an image for the dish, I'm not convinced yet either."

Not in current schema. Would need Convex file storage. Worth revisiting once the core loop is solid — images make the recipe list and calendar much more appealing, but add complexity (upload, storage, optimization).

### 10. Drag meals between slots (calendar)
> Shift assignments around by dragging a planned meal to another slot (another time of day and/or another day) instead of remove + re-add.

**Phase:** **Phase 2** — Phase 1 already covers assign/remove and undo; drag is a calendar UX upgrade on top of the same `mealPlans` model (no new tables). It is non-trivial because of **mobile/touch**, **occupied target slots** (swap vs replace vs merge rules), **accessibility** (keyboard + screen reader path), and keeping **Convex mutations** idempotent and conflict-safe when two people edit.

**Note:** PRD §4.3 already calls out drag-and-drop and copy/move between slots/days; this item tracks **in-calendar** drag specifically once the core loop is stable.

---

## Proposed tackle order

| Order | Item | Status |
|---|---|---|
| 1 | Slot assignment UX (#1) | **Done** — unified input, no tabs, leftovers shortcut, quick-add on no match |
| 2 | Recipe save hang (#2) | **Done** — `router.replace` + `router.refresh` for snappier nav |
| 3 | Undo for slot removal (#3) | **Done** — 5s toast with Undo button, deferred deletion |
| 4 | Performance (#4) | **Done** — batched names; stable chrome + `Link` for plan ↔ recipes; no plan paging skeleton; minimal recipe loading copy |
| 5 | Sign out + name (#5) | **Done** — Clerk `<UserButton>` (avatar only in nav; sign-out in menu) |
| 6 | Theme toggle (#6) | **Done** — Light/System/Dark; `scran-theme` in `localStorage`; `html.dark` + boot script |
| 7+ | Shopping list, drag slots (#10), cooking mode, images | Phase 2/3 (#10 = Phase 2). |
