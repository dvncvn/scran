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

## Phase 1 Scope Boundaries
> Explicitly NOT building these yet. Schema fields may exist but no UI.

- AI recipe extraction from URLs
- AI meal suggestions
- Shopping list generation
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

---

## Decision Log (Build-Time)

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-03 | Split scaffolding (1a) from schema (1b) from features (1c-1f) | Keeps boilerplate commits separate from meaningful code. Easier to review. |
| 2026-04-03 | Move PRD to `docs/`, retire `rough-plan.md` | rough-plan.md was a build prompt, not a reference. Useful content folded into build-log and CLAUDE.md. |
| 2026-04-03 | Keep `src/` directory from scaffold | create-next-app generated `src/` structure. Works well with `@/*` alias. Updated CLAUDE.md to match. |
| 2026-04-03 | On-demand user sync (not webhook) | Simpler for v1. getOrCreateUser runs on first app load. Can add webhook later for better reliability. |

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
