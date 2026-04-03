# Scran — Product Requirements Document

**Version:** 0.1 (Draft)
**Status:** Pre-development
**License:** Open Source (TBD)

---

## 1. Overview

Scran is a household meal planning and grocery management web app. It helps couples and families plan their week's meals, manage a growing recipe library, generate smart shopping lists, and track eating patterns over time. It is designed to be fast, beautiful, and genuinely useful in the daily rhythm of feeding a household.

Scran is open source. The canonical instance will be deployed to Vercel, but the project should be structured so others can fork, self-host, and customize it for their own households.

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js (App Router) | SSR, file-based routing, React Server Components, strong Vercel integration |
| Backend / Database | Convex | Real-time sync out of the box (two users editing the same week), clean relational-ish data model, good DX for mutations and queries |
| Auth | Clerk | Multi-user household support via organizations, invite flows, generous free tier, clean Convex integration |
| Deployment | Vercel | Zero-config for Next.js, edge functions, preview deploys for PRs |
| Typography | Geist Sans / Geist Mono | Clean baseline; aesthetic will evolve iteratively once core functionality is solid |
| AI Integration | Multi-model (Claude, Gemini) | Recipe extraction from URLs, meal suggestions, shopping list generation. Model selector in UI. API keys managed at household level by admin. |

---

## 3. User Model & Households

### 3.1 Accounts & Auth
- Users sign up via Clerk (email, Google, Apple — whatever Clerk supports).
- Every user belongs to exactly one **household** (modeled as a Clerk organization).
- The user who creates the household is the **household admin**.

### 3.2 Household Onboarding
New user flow:
1. Sign up / sign in.
2. If no household exists: create one (name it, set a theme).
3. If an invite is pending: confirm joining the existing household.
4. Set basic preferences (theme, display name).
5. Household admin configures API key(s) for AI features.

### 3.3 Household Members
- Each member has a display name and avatar (pulled from Clerk or set manually).
- Actions throughout the app are attributed to the member who performed them (who added a recipe, who planned Tuesday's dinner, who generated the shopping list).
- Household admin can invite/remove members and manage API keys. Other members should not need to think about API keys.

### 3.4 Household Profiles (Dietary)
- Each household member can have dietary tags and restrictions (e.g., gluten-free, no red meat, vegetarian, nut allergy).
- There should be a concept of **guest profiles** — saved people who eat with you regularly but aren't app users. Example: "Mom (gluten-free, no red meat)."
- When a guest is toggled onto a meal, suggestions and filtering automatically respect their constraints.

### 3.5 Children / Toddlers
- Household members can be flagged as **children** with an age or age range.
- Default assumption: children share the household meal.
- Override: any meal slot can have a **child-specific meal** carved out ("kids are having mac and cheese tonight").
- The data model should not hard-code "1 toddler" — other households may have different configurations.

---

## 4. Meal Planning

### 4.1 Calendar View
- **Primary view:** the next 5 days, starting from today.
- Navigation: scroll/swipe forward and backward through time. No hard boundary — users can plan weeks ahead or look back at what they ate.
- Each day shows slots for **breakfast**, **lunch**, **dinner**, and **snacks**.
- Snacks are a flexible slot — could be one item or several, not as rigidly structured as meals.

### 4.2 Meal Slots
Each meal slot can contain:
- A **recipe** from the library.
- A **restaurant** (eating out).
- A **leftover** reference (points to a previous meal: "Monday's chili").
- A **freeform entry** (quick text, no full recipe — "just gonna do sandwiches").
- A **child-specific override** beneath the main meal if the kids are eating something different.

### 4.3 Assigning Meals
- Drag and drop from recipe library or search.
- Quick-add inline.
- AI auto-suggest (see §8).
- Copy/move meals between slots and days.

### 4.4 Special Events & Holidays
- Any day can be flagged with a **special event** (birthday, Thanksgiving, Christmas, dinner party, etc.).
- Special event meals may carry different expectations: more elaborate, dessert slot, higher servings.
- Common holidays could auto-populate on the calendar (user-configurable list), but the flag is also manually addable.

### 4.5 Leftovers
- A meal slot can be marked as "leftovers from [meal]" with a reference back to the source meal.
- This affects the shopping list: if Tuesday's lunch is Monday's dinner leftovers, ingredients aren't double-counted.
- Leftovers should adjust the source meal's implied servings (if servings tracking is active).

---

## 5. Recipe Library

### 5.1 Recipe Data Model
Each recipe stores:

**Core:**
- Name (enforced to be specific and descriptive — see §5.4)
- Ingredients list (structured: ingredient name, quantity, unit, optional store section)
- Steps / instructions (ordered, supports step-by-step cooking mode — see §5.5)
- Servings (base yield)

**Metadata:**
- Author / source (who in the household added it)
- Cookbook reference (book title, page number) if applicable
- Source URL if extracted from the web
- Cuisine type (Italian, Mexican, Japanese, etc.)
- Dietary tags (vegetarian, vegan, gluten-free, dairy-free, nut-free, etc.)
- Allergen flags

**Nutrition (optional, per serving):**
- Calories
- Protein (grams)
- Other macros as desired (fat, carbs, fiber)

**Subjective ratings (per household):**
- Overall rating (1–5 scale)
- Effort level (easy / medium / involved / project)
- Indulgence level (healthy / balanced / indulgent / special occasion)
- Who rated it (visible attribution)
- Frequency data (auto-tracked: how often it's been planned/cooked)
- Last cooked date (auto-tracked)

**Future-proofing:**
- The data model should include an extensible `notes` or `journal` field (empty for now) so meal notes ("too salty," "kids loved it") can be added later without a schema migration.

### 5.2 Adding Recipes

Multiple input methods:

1. **Manual entry:** form-based, structured input for all fields above.
2. **URL extraction (AI-powered):** paste a recipe URL → AI parses the page and extracts structured recipe data. User reviews and confirms before saving.
3. **Import:** bulk import from JSON or CSV (see §12).

For AI extraction:
- Multi-model support (Claude, Gemini). Household admin sets API key(s) in settings.
- A **model selector** in the UI lets the user pick which model to use for extraction.
- The extraction should return a structured preview that the user edits before committing.

### 5.3 Search & Filtering
As the recipe library grows, robust search and filtering becomes essential:
- **Full-text search** across recipe names, ingredients, notes, cookbook references.
- **Filter by:** cuisine type, dietary tags, effort level, rating, indulgence, ingredient, time since last cooked, frequency.
- **Sort by:** name, rating, last cooked, times cooked, date added.
- Filters should be composable (e.g., "gluten-free AND effort:easy AND rating ≥ 4").

### 5.4 Duplicate Detection & Naming Hygiene
- When adding a recipe, the system should check for **potential duplicates** by fuzzy-matching on name and ingredients.
- Flag near-matches: "Tuna" vs "Tuna Salad," "PBJ" vs "Peanut Butter and Jelly Sandwich."
- Offer a **merge action** if two recipes are effectively the same.
- Encourage descriptive, differentiated naming in the UI (helper text, gentle warnings).
- Periodic "data hygiene" scan: a utility that reviews the full library for potential dupes and suggests merges.

### 5.5 Step-by-Step Cooking Mode
- Recipes with structured steps can be opened in a **cooking mode**: a focused, full-screen-ish view that shows one step at a time.
- Large text, easy to read from across a kitchen.
- Tap/swipe to advance steps.
- Timer integration where steps reference time ("simmer for 20 minutes").
- Ingredient quantities visible/referenced inline within steps.
- This makes Scran a cooking partner, not just a planner.

---

## 6. Restaurants

### 6.1 Restaurant Library
Restaurants are saved entities, similar to recipes:
- Name
- Cuisine type
- Location / address
- Link to menu
- Link for reservations
- Price range
- Notes ("get the lamb chops," "ask for the corner booth")
- Household rating
- Dietary suitability tags (so filtering works when a guest with restrictions is joining)

### 6.2 Assigning to Meal Slots
- Restaurants can be dragged/assigned to any meal slot just like a recipe.
- When a restaurant is on the calendar, it should have some **visual differentiation** — distinct styling or iconography so it's immediately clear you're eating out that night.
- Restaurants do not contribute to the shopping list.

---

## 7. Pantry & Staples

### 7.1 Staples List
- Households maintain a **pantry/staples list**: items they always have on hand (olive oil, salt, pepper, rice, eggs, butter, etc.).
- When generating a shopping list, ingredients that match a staple are **excluded by default** (but can be manually re-added if you're actually out).

### 7.2 Pantry Management
- Add/remove staples.
- The exact UX for pantry tracking (do you mark when you're low? do you track quantities?) is TBD. For v1, it's a simple inclusion/exclusion list. The data model should allow for quantity tracking later.

---

## 8. AI-Powered Meal Suggestions

### 8.1 Auto-Suggest
- Users can request AI-generated meal plans for a configurable window (default: next 5 days).
- The AI considers: the household's recipe library, dietary constraints, recent meal history (avoid repeats), ratings and preferences.

### 8.2 Guardrails & Parameters
Built-in rules (configurable by household):
- No repeating the same meal within X days.
- No more than N pasta/grain-heavy dinners per week.
- No red meat on consecutive nights.
- At least one vegetable-forward dinner per week.
- Balance effort across the week (don't stack three hard meals on a weeknight).
- Avoid clustering indulgent meals.
- Respect all dietary tags and guest constraints for flagged meals.

### 8.3 Natural Language Overrides
- Users can type freeform instructions that modify suggestions: "we're in a Mexican food mood this week," "something light — we overate this weekend," "use up the chicken thighs in the fridge."
- These overrides are passed as context to the AI alongside the structured guardrails.

### 8.4 Reroll
- Users can accept, reject, or reroll individual meal suggestions or the entire plan.
- Reroll should produce meaningfully different results, not minor shuffles.

### 8.5 Special Event Awareness
- If a day is flagged as a special event (birthday, holiday), suggestions for that day should reflect it: more elaborate, celebratory, possibly higher effort and indulgence.

---

## 9. Shopping List

### 9.1 Generation
- Generated from planned meals over a configurable window (smart default: next 5 days).
- Aggregates ingredients across all planned meals, combining quantities where possible ("2 cans diced tomatoes from Chili + 1 can from Shakshuka = 3 cans diced tomatoes").
- Excludes pantry staples by default.
- Excludes ingredients from restaurant meals and leftover slots.
- Accounts for servings if tracked.

### 9.2 Store Organization
- Items grouped by **store section** (produce, meat & seafood, dairy, bakery, frozen, bulk/dry goods, canned goods, condiments & oils, beverages, household).
- Default section ordering optimized for **Whole Foods** layout.
- Users can customize section order to match their store's layout.
- Future: support for multiple store profiles.

### 9.3 Item Metadata
Each shopping list item shows:
- What it's for: which meal(s) it contributes to, or if it's a pantry restock, or a manually added item.
- Quantity (aggregated).
- Store section.

### 9.4 Manual Additions
- Users can add arbitrary items to any shopping list (things not tied to a recipe — paper towels, toddler snacks, etc.).

### 9.5 Output & Distribution
- **Email:** send the shopping list to one or both household members as a clean, formatted email.
- **In-app checklist:** a mobile-friendly tap-to-cross-off view for use in the store.
- **Export:** copy to clipboard as formatted text, or export as markdown.

### 9.6 History
- All generated shopping lists are saved with their date and the meal plan they were derived from.
- Historical lists are browsable for reference ("what did we buy two weeks ago?").
- Option to **re-run** a historical list (regenerate it as a new list for the current week).

---

## 10. Notifications

### 10.1 Email Notifications
- **Meal prep reminders:** "You're making slow cooker chili tomorrow — defrost the beef tonight."
- **Shopping list reminders:** configurable day/time to receive that week's shopping list.
- **Meal plan gaps:** "You haven't planned dinners for Thursday and Friday yet."
- Notification preferences managed per user in settings. Nothing is on by default — opt-in.

---

## 11. Stats & Data Visualization

### 11.1 Dashboard
A dedicated stats page with visualizations:

**Cooking patterns:**
- Meals cooked vs. eaten out vs. leftovers over time.
- Effort distribution per week (how hard are you cooking?).
- "New recipe" rate vs. comfort food repeats.

**Nutrition trends:**
- Average calories/protein per day or week (where data exists).
- Dietary tag distribution (how often are you eating vegetarian, gluten-free, etc.).

**Variety metrics:**
- Cuisine type distribution over time.
- Recipe repeat frequency (most-cooked meals).
- Ingredient diversity.

**Fun/vanity stats:**
- Longest streak of home-cooked dinners.
- Total unique recipes cooked.
- "Adventurousness" score (ratio of new recipes to repeats).

### 11.2 Inline Stats
- Sprinkle contextual stats throughout the UI where relevant: on a recipe card ("last cooked 3 weeks ago, cooked 7 times total"), on the weekly view ("3/5 dinners planned, 2 new recipes this week").

### 11.3 Scope
- Stats are per-household.
- Historical data accumulates over time — the longer you use Scran, the richer the stats.

---

## 12. Import & Export

### 12.1 Import
- Import recipes from JSON or CSV matching Scran's schema.
- Validation and preview before committing.
- Duplicate detection runs on import.

### 12.2 Export
- Export full recipe library as JSON.
- Export meal history as JSON or CSV.
- Export a single recipe as JSON or markdown (for sharing externally, embedding in a blog, etc.).

---

## 13. Responsive Design

- The app must work flawlessly on desktop, tablet, and mobile.
- Mobile is arguably the primary context (planning on the couch, shopping in the store, cooking in the kitchen).
- Touch targets sized appropriately. Swipe gestures where natural (calendar navigation, cooking mode steps).
- No horizontal scroll on any viewport. No broken layouts. No tiny tap targets.
- Performance is non-negotiable: fast initial load, instant navigation, smooth animations.

---

## 14. Open Source Considerations

### 14.1 Self-Hosting
- The project should ship with clear setup instructions.
- Docker / docker-compose support is a nice-to-have but not required for v1.
- Environment variable configuration for Convex, Clerk, and AI API keys.

### 14.2 Customization Points
- Theme/color scheme.
- Default store section ordering.
- Guardrail parameters for AI suggestions.
- Notification preferences.
- Pantry staples.

### 14.3 Contribution-Friendly
- Clean code structure, typed throughout (TypeScript).
- Component-driven architecture.
- Documented data model.

---

## 15. Non-Goals (for v1)

These are explicitly out of scope for the initial build, but the architecture should not preclude them:

- Meal prep / batch cooking workflows.
- Recurring meal templates ("Taco Tuesday every week").
- Direct grocery delivery integration (Instacart, etc.).
- Offline / PWA support (export to markdown is the workaround).
- Per-user ratings (household-level for now, with attribution).
- Meal notes / cooking journal (data model supports it, UI deferred).
- Sharing recipes externally (beyond household).
- Pantry quantity tracking (simple include/exclude list for now).

---

## 16. Phasing (Suggested)

### Phase 1 — Core Loop
- Auth, household creation, onboarding.
- Recipe library (manual add, search, filtering, duplicate detection).
- Meal calendar (5-day view, assign recipes, restaurants, freeform).
- Shopping list generation and in-app checklist.
- Responsive layout with Geist typography. Functional, clean, not fancy yet.

### Phase 2 — Intelligence
- AI recipe extraction from URLs (multi-model).
- AI meal suggestions with guardrails and reroll.
- Notifications (email).
- Pantry / staples list.
- Leftovers tracking.

### Phase 3 — Polish & Depth
- Stats dashboard and inline stats.
- Step-by-step cooking mode.
- Shopping list email delivery and history.
- Special event flags and holiday awareness.
- Guest profiles with dietary constraints.
- Store section customization.
- Import / export.
- Aesthetic refinement (advanced theming, animations, visual identity).

---

## Appendix A: Key Data Entities

```
Household
├── Members (User[])
├── Guest Profiles (GuestProfile[])
├── Pantry Staples (StapleItem[])
├── Recipes (Recipe[])
├── Restaurants (Restaurant[])
├── Meal Plan (Day → MealSlot[])
├── Shopping Lists (ShoppingList[])
├── Settings
│   ├── Theme
│   ├── Store section order
│   ├── AI API keys
│   ├── Suggestion guardrails
│   └── Notification preferences
└── Stats (computed/aggregated)
```

## Appendix B: AI Prompt Editing

The guardrails for meal suggestions (§8.2) should be **editable by the household admin** as structured parameters, but the underlying prompt template should also be accessible for advanced users who want to tweak the AI's behavior directly. This is an open-source project — power users will want this control.

The prompt should receive:
- The household's recipe library (or a relevant subset).
- Recent meal history (last 2–4 weeks).
- Dietary constraints for all diners (members + toggled guests).
- Structured guardrails.
- Natural language overrides from the user.
- Special event flags for the planning window.
- Stats context (what's been overrepresented lately).
