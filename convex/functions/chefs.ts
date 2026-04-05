import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const get = query({
  args: { id: v.id("chefs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: {
    householdId: v.id("households"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chefs")
      .withIndex("by_householdId", (q) =>
        q.eq("householdId", args.householdId)
      )
      .collect();
  },
});

export const search = query({
  args: {
    householdId: v.id("households"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("chefs")
      .withIndex("by_householdId", (q) =>
        q.eq("householdId", args.householdId)
      )
      .collect();

    if (!args.query.trim()) return all;

    const lower = args.query.toLowerCase();
    return all.filter((c) => c.name.toLowerCase().includes(lower));
  },
});

export const getOrCreate = mutation({
  args: {
    householdId: v.id("households"),
    name: v.string(),
    addedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const trimmed = args.name.trim();
    if (!trimmed) throw new Error("Chef name is required");

    // Case-insensitive duplicate check
    const existing = await ctx.db
      .query("chefs")
      .withIndex("by_householdId", (q) =>
        q.eq("householdId", args.householdId)
      )
      .collect();

    const match = existing.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (match) return match._id;

    return await ctx.db.insert("chefs", {
      householdId: args.householdId,
      name: trimmed,
      addedBy: args.addedBy,
    });
  },
});
