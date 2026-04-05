import { v } from "convex/values";
import { mutation, query, DatabaseReader } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { aggregateIngredients, inferStoreSection } from "../lib/aggregateIngredients";

/** Build aggregated items from meal plans in a date range. */
async function buildItemsForDateRange(
  db: DatabaseReader,
  householdId: Id<"households">,
  startDate: string,
  endDate: string
) {
  const plans = await db
    .query("mealPlans")
    .withIndex("by_householdId_date", (q) =>
      q.eq("householdId", householdId).gte("date", startDate)
    )
    .filter((q) => q.lte(q.field("date"), endDate))
    .collect();

  const recipeIdOccurrences: string[] = [];
  for (const plan of plans) {
    for (const slot of plan.slots) {
      if (slot.entryType === "recipe" && slot.recipeId) {
        recipeIdOccurrences.push(slot.recipeId);
      }
      if (
        slot.childOverride?.entryType === "recipe" &&
        slot.childOverride.recipeId
      ) {
        recipeIdOccurrences.push(slot.childOverride.recipeId);
      }
    }
  }

  const uniqueIds = [...new Set(recipeIdOccurrences)];
  const recipeMap = new Map<string, { ingredients: { name: string; quantity: number; unit: string; storeSection?: string; isStaple?: boolean }[] }>();
  for (const id of uniqueIds) {
    const recipe = await db.get(id as Id<"recipes">);
    if (recipe) {
      recipeMap.set(id, { ingredients: recipe.ingredients });
    }
  }

  const recipeIngredients = recipeIdOccurrences
    .filter((id) => recipeMap.has(id))
    .map((id) => ({
      recipeId: id as Id<"recipes">,
      ingredients: recipeMap.get(id)!.ingredients,
    }));

  const staples = await db
    .query("pantryStaples")
    .withIndex("by_householdId", (q) =>
      q.eq("householdId", householdId)
    )
    .collect();
  const pantryStapleNames = new Set(
    staples.map((s) => s.name.trim().toLowerCase())
  );

  return aggregateIngredients(recipeIngredients, pantryStapleNames);
}

export const generate = mutation({
  args: {
    householdId: v.id("households"),
    startDate: v.string(),
    endDate: v.string(),
    generatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const items = await buildItemsForDateRange(
      ctx.db,
      args.householdId,
      args.startDate,
      args.endDate
    );

    return await ctx.db.insert("shoppingLists", {
      householdId: args.householdId,
      generatedAt: Date.now(),
      generatedBy: args.generatedBy,
      dateRangeStart: args.startDate,
      dateRangeEnd: args.endDate,
      items,
      manualItems: [],
    });
  },
});

export const regenerate = mutation({
  args: {
    listId: v.id("shoppingLists"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) throw new Error("Shopping list not found");

    const items = await buildItemsForDateRange(
      ctx.db,
      list.householdId,
      args.startDate,
      args.endDate
    );

    await ctx.db.patch(args.listId, {
      dateRangeStart: args.startDate,
      dateRangeEnd: args.endDate,
      items,
      // Keep manualItems — those are user-added and independent of date range
    });
  },
});

export const get = query({
  args: { id: v.id("shoppingLists") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listForHousehold = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    const lists = await ctx.db
      .query("shoppingLists")
      .withIndex("by_householdId_generatedAt", (q) =>
        q.eq("householdId", args.householdId)
      )
      .order("desc")
      .take(20);

    return lists.map((list) => ({
      _id: list._id,
      generatedAt: list.generatedAt,
      dateRangeStart: list.dateRangeStart,
      dateRangeEnd: list.dateRangeEnd,
      itemCount: list.items.length + list.manualItems.length,
      checkedCount:
        list.items.filter((i) => i.checked).length +
        list.manualItems.filter((i) => i.checked).length,
    }));
  },
});

export const toggleItem = mutation({
  args: {
    listId: v.id("shoppingLists"),
    itemIndex: v.number(),
    isManual: v.boolean(),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) throw new Error("Shopping list not found");

    if (args.isManual) {
      const items = [...list.manualItems];
      if (args.itemIndex < 0 || args.itemIndex >= items.length) {
        throw new Error("Invalid item index");
      }
      items[args.itemIndex] = {
        ...items[args.itemIndex],
        checked: !items[args.itemIndex].checked,
      };
      await ctx.db.patch(args.listId, { manualItems: items });
    } else {
      const items = [...list.items];
      if (args.itemIndex < 0 || args.itemIndex >= items.length) {
        throw new Error("Invalid item index");
      }
      items[args.itemIndex] = {
        ...items[args.itemIndex],
        checked: !items[args.itemIndex].checked,
      };
      await ctx.db.patch(args.listId, { items });
    }
  },
});

export const addManualItem = mutation({
  args: {
    listId: v.id("shoppingLists"),
    name: v.string(),
    storeSection: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) throw new Error("Shopping list not found");

    const trimmed = args.name.trim();
    if (!trimmed) throw new Error("Item name is required");

    await ctx.db.patch(args.listId, {
      manualItems: [
        ...list.manualItems,
        {
          name: trimmed,
          storeSection: args.storeSection || inferStoreSection(trimmed),
          checked: false,
        },
      ],
    });
  },
});

export const removeManualItem = mutation({
  args: {
    listId: v.id("shoppingLists"),
    itemIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) throw new Error("Shopping list not found");

    if (args.itemIndex < 0 || args.itemIndex >= list.manualItems.length) {
      throw new Error("Invalid item index");
    }

    const items = [...list.manualItems];
    items.splice(args.itemIndex, 1);
    await ctx.db.patch(args.listId, { manualItems: items });
  },
});

export const deleteList = mutation({
  args: { id: v.id("shoppingLists") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
