import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

const slotValidator = v.object({
  slotType: v.union(
    v.literal("breakfast"),
    v.literal("lunch"),
    v.literal("dinner"),
    v.literal("snack")
  ),
  entryType: v.union(
    v.literal("recipe"),
    v.literal("restaurant"),
    v.literal("leftover"),
    v.literal("freeform")
  ),
  recipeId: v.optional(v.id("recipes")),
  restaurantId: v.optional(v.id("restaurants")),
  leftoverSourceSlotId: v.optional(v.string()),
  freeformText: v.optional(v.string()),
  childOverride: v.optional(
    v.object({
      entryType: v.union(
        v.literal("recipe"),
        v.literal("restaurant"),
        v.literal("leftover"),
        v.literal("freeform")
      ),
      recipeId: v.optional(v.id("recipes")),
      restaurantId: v.optional(v.id("restaurants")),
      freeformText: v.optional(v.string()),
    })
  ),
  assignedBy: v.id("users"),
  assignedAt: v.number(),
});

export const getForDateRange = query({
  args: {
    householdId: v.id("households"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query("mealPlans")
      .withIndex("by_householdId_date", (q) =>
        q.eq("householdId", args.householdId).gte("date", args.startDate)
      )
      .filter((q) => q.lte(q.field("date"), args.endDate))
      .collect();

    return plans;
  },
});

export const assignSlot = mutation({
  args: {
    householdId: v.id("households"),
    date: v.string(),
    slot: slotValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mealPlans")
      .withIndex("by_householdId_date", (q) =>
        q.eq("householdId", args.householdId).eq("date", args.date)
      )
      .unique();

    if (existing) {
      // Remove any existing slot of the same type, then add the new one
      const filteredSlots = existing.slots.filter(
        (s) => s.slotType !== args.slot.slotType
      );
      await ctx.db.patch(existing._id, {
        slots: [...filteredSlots, args.slot],
      });
      return existing._id;
    } else {
      return await ctx.db.insert("mealPlans", {
        householdId: args.householdId,
        date: args.date,
        slots: [args.slot],
      });
    }
  },
});

export const removeSlot = mutation({
  args: {
    householdId: v.id("households"),
    date: v.string(),
    slotType: v.union(
      v.literal("breakfast"),
      v.literal("lunch"),
      v.literal("dinner"),
      v.literal("snack")
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mealPlans")
      .withIndex("by_householdId_date", (q) =>
        q.eq("householdId", args.householdId).eq("date", args.date)
      )
      .unique();

    if (!existing) return;

    const filteredSlots = existing.slots.filter(
      (s) => s.slotType !== args.slotType
    );

    if (filteredSlots.length === 0) {
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.patch(existing._id, { slots: filteredSlots });
    }
  },
});
