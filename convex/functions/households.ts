import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const householdId = await ctx.db.insert("households", {
      name: args.name,
      createdBy: args.createdBy,
    });

    // Link the creating user to the household
    await ctx.db.patch(args.createdBy, {
      householdId,
      role: "admin",
    });

    return householdId;
  },
});

export const get = query({
  args: { id: v.id("households") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
