# Natural language & agents — architecture notes

Companion to the PRD (§8). This doc captures **how** we intend to wire NL and autonomous agents without duplicating product requirements.

## Principles

1. **NL → structured tools, not NL → database.** The model turns user text into **validated calls** to the same Convex mutations and queries the UI uses. No parallel business-logic path that can drift.
2. **Household-scoped auth.** Tools run as the signed-in user (Clerk → Convex `ctx.auth`), same as today. Service or “headless” agents still need an identity story (e.g. act-as-user or future bot user) before automation without a human in the loop.
3. **Server-side intelligence.** API keys and model calls live on the server (Next.js route handlers and/or Convex actions), aligned with household-managed keys in settings (PRD).
4. **Targeted reads.** Prefer date-bounded meal plans, search, and metadata (e.g. `lastCookedAt`, ratings) over sending the full recipe library in every prompt.

## What to add incrementally

| Area | Why |
|------|-----|
| **Bulk / workflow mutations** | Copy a week, apply a multi-day plan, or clear a range in **few mutations** instead of many `assignSlot` calls — fewer partial failures and easier agent tool design. |
| **Stable “tool surface”** | Document mutations/queries (names, args, invariants) as the contract for NL and any MCP/agent integration. |
| **Optional provenance** | Later: `source: "ui" \| "agent"` (or similar) on writes if analytics matter; not required on day one. |

## Defer until there is a concrete need

- Separate “agent database” or sync layer — Convex remains source of truth.
- Vector / embedding search — only if semantic matching beyond name + filters is a hard requirement.
- GraphQL or a second public API — HTTP actions or documented Convex calls are enough initially.

## Related PRD sections

- §4 Meal planning, §5 Recipes, **§8 AI-Powered Meal Suggestions** (including NL overrides and guardrails).
- Shopping list and stats will eventually consume the same planned meals; agents should not bypass those rules when those features exist.

_Last updated: 2026-04-03_
