# Scran

Household meal planning and grocery management. Plan meals on a calendar, keep a shared recipe library, and (in later phases) generate shopping lists and richer household features. Open source.

## Stack

- **Next.js** (App Router) + **React** + **TypeScript**
- **Convex** — backend, real-time data
- **Clerk** — authentication
- **Tailwind CSS** v4

More detail: [`CLAUDE.md`](./CLAUDE.md) (project conventions and data model summary).

## Prerequisites

- **Node.js** (LTS recommended; matches Next.js / tooling expectations)
- A **Convex** project ([convex.dev](https://convex.dev)) — create one and link this repo with the Convex CLI
- A **Clerk** application ([clerk.com](https://clerk.com)) — JWT template configured for Convex per Convex + Clerk docs

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables**

   ```bash
   cp .env.example .env
   ```

   Fill every value in `.env` using:

   - Convex dashboard / CLI output → `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`
   - Clerk dashboard → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`

   Route keys in `.env.example` should match your app URLs (defaults assume `/sign-in`, `/sign-up`, post-auth to `/plan` or `/onboarding`).

3. **Run Convex** (pushes schema and functions, gives you a dev deployment)

   ```bash
   npx convex dev
   ```

   Leave this running while you work, or run it once to deploy then use dashboard deploys as you prefer.

4. **Run the Next.js app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign up, complete onboarding (create a household), then use **Plan** and **Recipes**.

## Using the app (Phase 1)

- **Sign in / sign up** — Clerk-hosted pages at `/sign-in` and `/sign-up`.
- **Onboarding** — First-time users create a household name; you are redirected to the meal plan when done.
- **Meal plan (`/plan`)** — Five-day window; move forward/back with the arrows or jump to **Today**. Each day has Breakfast, Lunch, Dinner, Snack. Tap an empty slot to assign a **recipe** (search), **quick text**, or **leftovers**; tap a filled slot’s link to open the recipe. Remove a meal with **×** (short undo window before it commits).
- **Recipes (`/recipes`)** — Browse and search; add recipes at **New Recipe**; open one for detail, edit, or delete. Names are checked for near-duplicates when saving.

Protected routes require a signed-in Clerk user; the app syncs a Convex `users` row and expects a `householdId` for main screens.

## Scripts

| Command        | Purpose                          |
| -------------- | -------------------------------- |
| `npm run dev`  | Next.js dev server               |
| `npm run build`| Production build                 |
| `npm run start`| Run production build locally     |
| `npm run lint` | ESLint                           |
| `npx convex dev` | Convex dev deploy + codegen    |

## Docs in this repo

- [`docs/scran-prd.md`](./docs/scran-prd.md) — product requirements
- [`docs/build-log.md`](./docs/build-log.md) — what’s built and what’s next
- [`docs/feedback-phase1.md`](./docs/feedback-phase1.md) — walkthrough feedback and backlog notes
- [`docs/agent-natural-language.md`](./docs/agent-natural-language.md) — how NL/agents should hook into Convex (when you build that)

## Theme

**Light**, **System**, and **Dark** are available from the nav (signed-in app) or a compact control on sign-in / sign-up / onboarding. Choice is stored in the browser as `scran-theme` in `localStorage`.

## Development notes

- **Agentation** (dev dependency) loads only when `NODE_ENV === "development"` for in-browser feedback tooling; see [`src/app/DevAgentation.tsx`](./src/app/DevAgentation.tsx).
- Convex function and schema entry points live under `convex/`; UI under `src/app/` and `components/`.
