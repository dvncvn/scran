import type { Doc, Id } from "../convex/_generated/dataModel";

/** Unique recipe ids referenced by recipe slots in the given plans. */
export function collectRecipeIdsFromPlans(
  plans: Doc<"mealPlans">[]
): Id<"recipes">[] {
  const seen = new Set<string>();
  const ids: Id<"recipes">[] = [];
  for (const plan of plans) {
    for (const slot of plan.slots) {
      if (slot.entryType === "recipe" && slot.recipeId && !seen.has(slot.recipeId)) {
        seen.add(slot.recipeId);
        ids.push(slot.recipeId);
      }
    }
  }
  return ids;
}
