# Scran

Scran is a household meal planning and grocery management web app. It helps couples and families plan meals, manage recipes, generate smart shopping lists, and track eating patterns over time. It is open source.

## Tech Stack

- **Framework:** Next.js 15 (App Router, TypeScript strict, no `any`)
- **Backend / Database:** Convex
- **Auth:** Clerk (integrated with Convex for identity)
- **Styling:** Tailwind CSS v4
- **Typography:** Geist Sans / Geist Mono
- **Deployment:** Vercel
- **AI:** Multi-model (Claude, Gemini) — API keys managed per household

## Project Structure

```
scran/
├── src/
│   ├── app/                # Next.js App Router pages and layouts
│   │   ├── (auth)/         # Sign-in, sign-up, onboarding routes
│   │   ├── (app)/          # Authenticated app routes
│   │   │   ├── plan/       # Meal calendar view (primary screen)
│   │   │   ├── recipes/    # Recipe library, detail, add/edit
│   │   │   ├── restaurants/# Restaurant library
│   │   │   ├── shopping/   # Shopping list generation and history
│   │   │   ├── stats/      # Data visualizations and dashboards
│   │   │   └── settings/   # Household settings, members, API keys, pantry
│   │   └── layout.tsx
│   └── middleware.ts        # Clerk auth middleware
├── components/              # Shared UI components
│   ├── ui/                  # Primitives (buttons, inputs, cards, modals)
│   └── features/            # Feature-specific components (meal-card, recipe-form, etc.)
├── convex/                  # Convex backend
│   ├── schema.ts            # Database schema (source of truth for data model)
│   ├── functions/           # Queries, mutations, actions organized by domain
│   └── _generated/          # Convex auto-generated types
├── lib/                     # Shared utilities, constants, types
├── hooks/                   # Custom React hooks
├── docs/                    # PRD, build log, design docs
└── public/
```

## Data Model (Core Entities)

```
Household
├── id, name, createdBy
├── settings (theme, storeLayout, suggestionGuardrails, notificationPrefs)
├── aiApiKeys (encrypted, admin-only)

User (synced from Clerk)
├── id, clerkId, householdId
├── displayName, avatar, role (admin | member)
├── dietaryTags[], isChild, childAgeRange?

GuestProfile
├── id, householdId, name
├── dietaryTags[], restrictions[]

Recipe
├── id, householdId, name (unique per household, descriptive naming enforced)
├── ingredients[] (name, quantity, unit, storeSection?, isStaple?)
├── steps[] (order, instruction, durationMinutes?)
├── servings (base yield)
├── source (manual | url), sourceUrl?, cookbookRef? (title, page)
├── addedBy (userId), createdAt, updatedAt
├── cuisineType, dietaryTags[], allergenFlags[]
├── calories?, proteinGrams?, fatGrams?, carbGrams?
├── householdRating (1-5), ratedBy (userId), effortLevel (easy|medium|involved|project)
├── indulgenceLevel (healthy|balanced|indulgent|special-occasion)
├── timesCooked (auto), lastCookedAt (auto)
├── notes? (empty for v1, reserved for future meal journal)

Restaurant
├── id, householdId, name
├── cuisineType, priceRange, address?, menuUrl?, reservationUrl?
├── dietaryTags[], notes?
├── householdRating, addedBy

MealPlan (one doc per day per household)
├── id, householdId, date
├── specialEvent? (name, type: birthday|holiday|dinnerParty|custom)
├── slots[]
│   ├── slotType (breakfast | lunch | dinner | snack)
│   ├── entryType (recipe | restaurant | leftover | freeform)
│   ├── recipeId? | restaurantId? | leftoverSourceSlotId? | freeformText?
│   ├── childOverride? (same structure — a separate entry for kids)
│   ├── assignedBy (userId), assignedAt

ShoppingList
├── id, householdId, generatedAt, generatedBy
├── dateRangeStart, dateRangeEnd
├── items[]
│   ├── name, quantity, unit, storeSection
│   ├── source (recipeId | manual | pantryRestock)
│   ├── checked (boolean)
├── manualItems[] (name, storeSection?, checked)
├── sentTo? (email addresses)

PantryStaple
├── id, householdId, name, storeSection?
├── addedBy, createdAt
```

## Conventions

- **TypeScript strict mode.** No `any`. Define types for all Convex documents.
- **Components:** PascalCase filenames. One component per file. Colocate styles.
- **Convex functions:** Organized by domain (e.g., `convex/functions/recipes.ts`, `convex/functions/mealPlans.ts`). Use input validation on all mutations.
- **Responsive first.** Mobile is the primary context. Every component must work at 375px. No horizontal scroll ever.
- **Accessibility:** Semantic HTML, keyboard navigation, ARIA labels where needed.
- **No premature optimization.** Get it working, then make it pretty. Geist + Tailwind defaults are fine for now.
- **Attribution:** All user-facing mutations should record which user performed the action.
- **Naming:** Recipe names must be descriptive. UI should discourage vague names and flag potential duplicates on creation.

## Current Status

Phase 1 — complete. Phase 2 starting. See `docs/scran-prd.md` for the full PRD, `docs/build-log.md` for detailed progress.

### What exists:
- Next.js 15 + Tailwind v4 + Convex + Clerk scaffold
- Convex schema (households, users, recipes, restaurants, mealPlans, guestProfiles, pantryStaples, shoppingLists)
- Auth flow (sign-in, sign-up, onboarding, middleware, route protection)
- Meal calendar — 5-day view with recipe/freeform slot assignment, responsive single-column on mobile
- Recipe CRUD — list, create, detail, edit, delete with duplicate detection, fraction quantities
- Calendar ↔ recipe integration with client-side search filtering
- Shopping lists — generate from meal plans, ingredient aggregation, auto-categorization, tap-to-check checklist, manual items, editable date ranges, history
- Mobile bottom tab bar (Plan, Recipes, Shopping)

### What's next (Phase 2 — Intelligence):
- Wire up `timesCooked`/`lastCookedAt` auto-tracking (schema fields exist, write path needed)
- AI recipe extraction from URLs (multi-model)
- AI meal suggestions with guardrails and reroll
- Pantry / staples list UI
- Leftovers tracking

### Scope Boundaries
> Not building these yet. Schema fields may exist but no UI.

- Stats dashboard / data visualization (Phase 3, depends on tracking data)
- Notifications
- Guest profile UI
- Step-by-step cooking mode, Import/export
- Special event UI, Child meal override UI
- Recurring meals / templates
- Restaurant/leftover entry types in calendar (schema only)
- Theming beyond Geist defaults

## Key Decision Log

| Decision | Choice | Why |
|---|---|---|
| Backend | Convex | Real-time sync for two users editing the same week. Clean DX. |
| Auth | Clerk | Org model maps to households. Invites built in. Good Convex integration. |
| AI provider | Multi-model | Household admin picks model and manages keys. No vendor lock-in. |
| Ratings | Per-household | Simpler for v1. Who-rated-it is tracked for attribution. |
| Pantry | Simple include/exclude | No quantity tracking in v1. Data model allows adding it later. |
| Leftovers | Reference-based | Points to source meal. Avoids double-counting in shopping list. |

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
