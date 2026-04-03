import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

const ingredientValidator = v.object({
  name: v.string(),
  quantity: v.number(),
  unit: v.string(),
  storeSection: v.optional(v.string()),
  isStaple: v.optional(v.boolean()),
});

const stepValidator = v.object({
  order: v.number(),
  instruction: v.string(),
  durationMinutes: v.optional(v.number()),
});

export const list = query({
  args: {
    householdId: v.id("households"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("recipes")
      .withIndex("by_householdId", (q) =>
        q.eq("householdId", args.householdId)
      )
      .collect();
  },
});

export const get = query({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const search = query({
  args: {
    householdId: v.id("households"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("recipes")
      .withIndex("by_householdId", (q) =>
        q.eq("householdId", args.householdId)
      )
      .collect();

    if (!args.query.trim()) return all;

    const lower = args.query.toLowerCase();
    return all.filter((r) => r.name.toLowerCase().includes(lower));
  },
});

export const findSimilarNames = query({
  args: {
    householdId: v.id("households"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.name.trim()) return [];

    const all = await ctx.db
      .query("recipes")
      .withIndex("by_householdId", (q) =>
        q.eq("householdId", args.householdId)
      )
      .collect();

    const lower = args.name.toLowerCase();
    return all.filter((r) => {
      const rLower = r.name.toLowerCase();
      return (
        rLower.includes(lower) ||
        lower.includes(rLower) ||
        levenshteinDistance(rLower, lower) <= 3
      );
    });
  },
});

export const create = mutation({
  args: {
    householdId: v.id("households"),
    name: v.string(),
    ingredients: v.array(ingredientValidator),
    steps: v.array(stepValidator),
    servings: v.number(),
    source: v.union(v.literal("manual"), v.literal("url")),
    sourceUrl: v.optional(v.string()),
    cookbookRef: v.optional(
      v.object({
        title: v.string(),
        page: v.optional(v.number()),
      })
    ),
    addedBy: v.id("users"),
    cuisineType: v.optional(v.string()),
    dietaryTags: v.optional(v.array(v.string())),
    allergenFlags: v.optional(v.array(v.string())),
    calories: v.optional(v.number()),
    proteinGrams: v.optional(v.number()),
    fatGrams: v.optional(v.number()),
    carbGrams: v.optional(v.number()),
    effortLevel: v.optional(
      v.union(
        v.literal("easy"),
        v.literal("medium"),
        v.literal("involved"),
        v.literal("project")
      )
    ),
    indulgenceLevel: v.optional(
      v.union(
        v.literal("healthy"),
        v.literal("balanced"),
        v.literal("indulgent"),
        v.literal("special-occasion")
      )
    ),
  },
  handler: async (ctx, args) => {
    if (!args.name.trim()) {
      throw new Error("Recipe name is required");
    }
    if (args.servings < 1) {
      throw new Error("Servings must be at least 1");
    }

    return await ctx.db.insert("recipes", {
      ...args,
      name: args.name.trim(),
      timesCooked: 0,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("recipes"),
    name: v.optional(v.string()),
    ingredients: v.optional(v.array(ingredientValidator)),
    steps: v.optional(v.array(stepValidator)),
    servings: v.optional(v.number()),
    sourceUrl: v.optional(v.string()),
    cookbookRef: v.optional(
      v.object({
        title: v.string(),
        page: v.optional(v.number()),
      })
    ),
    cuisineType: v.optional(v.string()),
    dietaryTags: v.optional(v.array(v.string())),
    allergenFlags: v.optional(v.array(v.string())),
    calories: v.optional(v.number()),
    proteinGrams: v.optional(v.number()),
    fatGrams: v.optional(v.number()),
    carbGrams: v.optional(v.number()),
    householdRating: v.optional(v.number()),
    ratedBy: v.optional(v.id("users")),
    effortLevel: v.optional(
      v.union(
        v.literal("easy"),
        v.literal("medium"),
        v.literal("involved"),
        v.literal("project")
      )
    ),
    indulgenceLevel: v.optional(
      v.union(
        v.literal("healthy"),
        v.literal("balanced"),
        v.literal("indulgent"),
        v.literal("special-occasion")
      )
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    if (fields.name !== undefined && !fields.name.trim()) {
      throw new Error("Recipe name is required");
    }
    if (fields.servings !== undefined && fields.servings < 1) {
      throw new Error("Servings must be at least 1");
    }

    // Remove undefined fields
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = key === "name" && typeof value === "string" ? value.trim() : value;
      }
    }

    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Simple Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}
