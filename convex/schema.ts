import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  households: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
    settings: v.optional(
      v.object({
        theme: v.optional(v.string()),
        storeLayout: v.optional(v.array(v.string())),
        suggestionGuardrails: v.optional(v.string()),
        notificationPrefs: v.optional(
          v.object({
            mealPrepReminders: v.boolean(),
            shoppingListReminders: v.boolean(),
            mealPlanGapAlerts: v.boolean(),
          })
        ),
      })
    ),
    aiApiKeys: v.optional(
      v.object({
        claude: v.optional(v.string()),
        gemini: v.optional(v.string()),
      })
    ),
  }),

  users: defineTable({
    clerkId: v.string(),
    householdId: v.optional(v.id("households")),
    displayName: v.string(),
    avatar: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("member")),
    dietaryTags: v.optional(v.array(v.string())),
    isChild: v.optional(v.boolean()),
    childAgeRange: v.optional(v.string()),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_householdId", ["householdId"]),

  guestProfiles: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    dietaryTags: v.optional(v.array(v.string())),
    restrictions: v.optional(v.array(v.string())),
  }).index("by_householdId", ["householdId"]),

  recipes: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    ingredients: v.array(
      v.object({
        name: v.string(),
        quantity: v.number(),
        unit: v.string(),
        storeSection: v.optional(v.string()),
        isStaple: v.optional(v.boolean()),
      })
    ),
    steps: v.array(
      v.object({
        order: v.number(),
        instruction: v.string(),
        durationMinutes: v.optional(v.number()),
      })
    ),
    servings: v.number(),
    source: v.union(v.literal("manual"), v.literal("url")),
    sourceUrl: v.optional(v.string()),
    cookbookRef: v.optional(
      v.object({
        title: v.string(),
        page: v.optional(v.number()),
      })
    ),
    chefId: v.optional(v.id("chefs")),
    addedBy: v.id("users"),
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
    mealTypes: v.optional(
      v.array(
        v.union(
          v.literal("breakfast"),
          v.literal("lunch"),
          v.literal("dinner"),
          v.literal("snack")
        )
      )
    ),
    timesCooked: v.number(),
    lastCookedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_householdId", ["householdId"])
    .index("by_householdId_name", ["householdId", "name"]),

  restaurants: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    cuisineType: v.optional(v.string()),
    priceRange: v.optional(v.string()),
    address: v.optional(v.string()),
    menuUrl: v.optional(v.string()),
    reservationUrl: v.optional(v.string()),
    dietaryTags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    householdRating: v.optional(v.number()),
    addedBy: v.id("users"),
  }).index("by_householdId", ["householdId"]),

  chefs: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    addedBy: v.id("users"),
  })
    .index("by_householdId", ["householdId"])
    .index("by_householdId_name", ["householdId", "name"]),

  mealPlans: defineTable({
    householdId: v.id("households"),
    date: v.string(), // ISO date string YYYY-MM-DD
    specialEvent: v.optional(
      v.object({
        name: v.string(),
        type: v.union(
          v.literal("birthday"),
          v.literal("holiday"),
          v.literal("dinnerParty"),
          v.literal("custom")
        ),
      })
    ),
    slots: v.array(
      v.object({
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
      })
    ),
  })
    .index("by_householdId", ["householdId"])
    .index("by_householdId_date", ["householdId", "date"]),

  pantryStaples: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    storeSection: v.optional(v.string()),
    addedBy: v.id("users"),
  }).index("by_householdId", ["householdId"]),
});
