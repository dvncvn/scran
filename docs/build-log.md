# Scran — Build Log

Living document. Tracks what's been done, what's in progress, and what's next. Updated as work progresses.

---

## Phase 1 — Core Loop

### 1a: Project Scaffolding & Tooling
> Get the repo, framework, and integrations wired up. Commit the boilerplate separately from meaningful code.

- [x] Initialize git repo
- [x] Scaffold Next.js 15 (App Router, TypeScript strict, Tailwind v4, ESLint)
- [x] Install and configure Convex
- [x] Install and configure Clerk (`@clerk/nextjs`) + Convex integration
- [x] Install Geist font, configure in Tailwind
- [x] Set up folder structure per CLAUDE.md
- [x] Create `.env.example` with all required env vars documented
- [ ] Verify dev server runs clean (needs Convex + Clerk credentials)

### 1b: Convex Schema
> Define the data model. This is the foundation everything else builds on.

- [x] Define full Phase 1 schema in `convex/schema.ts`: households, users, recipes, restaurants, mealPlans, guestProfiles, pantryStaples
- [x] Add indexes: recipes by householdId, mealPlans by householdId+date, users by clerkId, users by householdId
- [ ] Validate schema deploys to Convex without errors (needs Convex credentials)

### 1c: Auth & Onboarding
> Clerk sign-in/sign-up, user record sync, household creation, route protection.

- [x] `/sign-in` and `/sign-up` routes with Clerk components
- [x] Convex user sync from Clerk identity (on-demand via getOrCreateUser)
- [x] Household creation flow (post-first-sign-in onboarding page)
- [ ] Household join flow (pending Clerk org invite) — deferred, needs Clerk org setup
- [x] Route protection: Clerk middleware + app layout redirects
- [x] Redirect to `/plan` after household is set

### 1d: Meal Calendar (`/plan`)
> The primary screen. 5-day view, slot assignment, responsive layout.

- [x] 5-day calendar layout (columns on desktop, stacked on mobile)
- [x] Day navigation (prev/next to shift window)
- [x] Today highlighting
- [x] 4 slot sections per day: Breakfast, Lunch, Dinner, Snacks
- [x] Empty slot → tap to assign meal (modal selector)
- [x] Recipe search within assignment flow
- [x] Freeform text entry for slots
- [x] Display assigned recipe name, tap to navigate to recipe detail
- [x] Remove meal from slot
- [x] All mutations record acting user (assignedBy, assignedAt)
- [ ] Responsive polish at 375px, 768px, 1440px (structure in place, needs testing with live app)

### 1e: Recipe CRUD
> Recipe library, add/edit/delete, duplicate detection.

- [x] Recipe list page (`/recipes`) — grid with search, effort badge, rating display
- [x] Add recipe page (`/recipes/new`) — full form with all Phase 1 fields
- [x] Dynamic ingredient rows (add/remove)
- [x] Dynamic step rows (add/remove/reorder)
- [x] Duplicate detection on name blur (fuzzy match with Levenshtein distance)
- [x] Recipe detail page (`/recipes/[id]`)
- [x] Edit recipe (form in edit mode)
- [x] Delete recipe with confirmation modal
- [x] Server-side input validation on all mutations

### 1f: Wire It Together
> Calendar ↔ recipe library integration. Quick path from calendar to add recipe.

- [x] Calendar slot assignment searches recipe library
- [x] Assigned slot shows recipe name, links to detail
- [x] "Add new recipe" shortcut from calendar assignment flow
- [ ] End-to-end test: add recipe → assign to slot → view from calendar → remove (needs live app)

---

## Agent / natural language (future)

When starting NL or agent-driven flows, use **[`docs/agent-natural-language.md`](./agent-natural-language.md)** for architecture principles (structured tools, same Convex surface, bulk mutations). Product intent is in the PRD **§8.6**.

---

## Phase 1g: Shopping List Generation
> Generate from meal plans, aggregate ingredients, in-store checklist.

- [x] `shoppingLists` table added to Convex schema with indexes
- [x] Ingredient aggregation engine (`convex/lib/aggregateIngredients.ts`) — keys on name+unit, sums quantities, excludes pantry staples
- [x] Auto-categorization of ingredients by store section (keyword mapping)
- [x] `generate` mutation — reads meal plans, recipes, pantry staples, produces aggregated list
- [x] `regenerate` mutation — update date range and re-aggregate (preserves manual items)
- [x] Shopping list detail page (`/shopping/[id]`) — grouped checklist, tap-to-check, progress bar
- [x] Editable date range on existing lists
- [x] Manual item additions with auto-categorization
- [x] Recipe provenance shown on each item ("for: Bolognese, Shakshuka")
- [x] Shopping list history (`/shopping`) — recent lists with progress, delete
- [x] "Generate Shopping List" shortcut from plan page (uses current date range)
- [x] Shopping tab in mobile bottom nav and desktop nav

### 1h: UX Polish
- [x] Mobile bottom tab bar (Plan, Recipes, Shopping) — fixed, active state highlighting
- [x] Plan page: single-column below `lg`, no mixed grid at mid widths
- [x] Overflow fix: `min-w-0 overflow-x-hidden` on body and main
- [x] Recipe search: single stable subscription + client-side filtering (eliminates jank)
- [x] Chef name shown in search results
- [x] Debounce hook (`useDebouncedValue`) for search inputs
- [x] Fraction support for quantities: input ("1/3", "1 1/2"), display (½, ⅓, ¾), recipe detail + shopping list

---

## Phase 1 Scope Boundaries
> Explicitly NOT building these yet. Schema fields may exist but no UI.

- AI recipe extraction from URLs
- AI meal suggestions
- Stats / data visualization
- Notifications
- Pantry management UI (table defined, no UI)
- Guest profile UI (table defined, no UI)
- Step-by-step cooking mode
- Import / export
- Special event UI (field defined in mealPlans, no UI)
- Child meal override UI (field defined in slots, no UI)
- Theming beyond Geist defaults
- Restaurant entry type in calendar (schema supports it, not wired up)
- Leftover entry type in calendar (schema supports it, not wired up)
- Recurring meals / templates (PRD §15 non-goal, but architecture allows it)

---

## Stats Tracking — Foundations

Recipe documents have `timesCooked` (number) and `lastCookedAt` (timestamp) fields.
These need to be auto-updated when a planned meal date passes. Approach:

- **Trigger:** When the plan page renders past dates with recipe slots, fire a mutation to increment `timesCooked` and update `lastCookedAt` for those recipes.
- **Idempotency:** Track which (recipe, date) pairs have already been counted to avoid double-counting on re-renders. Options: a `cookedEvents` table, or a `countedDates` set on the meal plan doc.
- **What this unlocks:** Inline stats ("cooked 7 times, last 3 weeks ago"), recipe sorting by frequency/recency, variety metrics, the full Phase 3 stats dashboard.

This is foundational work — the schema fields exist, the write path needs to be wired up.

---

## Recurrence — Future Design Notes

Common pattern: "yogurt every weekday for breakfast." Two approaches considered:

1. **Quick-repeat (simpler):** "Copy this slot to [Mon–Fri] breakfasts." Bulk `assignSlot` mutation, no new schema. Covers 80% of the use case.
2. **Templates/rules (richer):** `mealTemplates` table with day-of-week rules. Scheduled job or user action stamps slots onto the calendar. More powerful, more complex.

Recommend starting with quick-repeat when this is prioritized.

---

## Decision Log (Build-Time)

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-03 | Split scaffolding (1a) from schema (1b) from features (1c-1f) | Keeps boilerplate commits separate from meaningful code. Easier to review. |
| 2026-04-03 | Move PRD to `docs/`, retire `rough-plan.md` | rough-plan.md was a build prompt, not a reference. Useful content folded into build-log and CLAUDE.md. |
| 2026-04-03 | Keep `src/` directory from scaffold | create-next-app generated `src/` structure. Works well with `@/*` alias. Updated CLAUDE.md to match. |
| 2026-04-03 | On-demand user sync (not webhook) | Simpler for v1. getOrCreateUser runs on first app load. Can add webhook later for better reliability. |
| 2026-04-05 | Client-side recipe search filtering | Server sends all recipes once (stable subscription), client filters with `useMemo`. Eliminates jank from multiple competing subscriptions. Scales fine for household-sized libraries. |
| 2026-04-05 | Shopping list: keyword-based auto-categorization | Ingredient names matched against a keyword→section map during aggregation. Good enough for v1, avoids requiring users to manually categorize. |
| 2026-04-05 | Fraction quantities stored as decimals, displayed as symbols | Schema keeps `quantity: number` (0.333 not "1/3"). UI parses fractions on input, formats with ½⅓¾ on display. Clean data, friendly UI. |

---

## Completed

### 2026-04-03
- Project scaffolded: Next.js 15, Tailwind v4, Convex, Clerk, Geist font
- Convex schema defined with all Phase 1 tables and indexes
- Auth flow: sign-in, sign-up, onboarding, Clerk middleware, app layout with route protection
- Meal calendar: 5-day view, slot assignment (recipe + freeform), navigation, today highlight
- Recipe CRUD: list with search, full creation form, detail view, edit/delete, duplicate detection
- Calendar ↔ recipe integration: search recipes from slot modal, link to detail, "add new recipe" path
- Project docs reorganized: PRD in docs/, build log created, CLAUDE.md updated

### 2026-04-05
- Shopping list generation: schema, aggregation engine, generate/regenerate mutations, checklist UI, history
- Mobile bottom tab bar with active state highlighting
- Plan page responsive fix (single-column below lg)
- Recipe search UX overhaul: stable subscription, client-side filtering, chef names in results
- Fraction quantity support across recipe form, detail view, and shopping list
- Ingredient auto-categorization by store section
