export const SLOT_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type SlotType = (typeof SLOT_TYPES)[number];

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const EFFORT_LEVELS = ["easy", "medium", "involved", "project"] as const;
export type EffortLevel = (typeof EFFORT_LEVELS)[number];

export const INDULGENCE_LEVELS = [
  "healthy",
  "balanced",
  "indulgent",
  "special-occasion",
] as const;
export type IndulgenceLevel = (typeof INDULGENCE_LEVELS)[number];

export const CUISINE_TYPES = [
  "American",
  "British",
  "Chinese",
  "French",
  "Greek",
  "Indian",
  "Italian",
  "Japanese",
  "Korean",
  "Mexican",
  "Middle Eastern",
  "Thai",
  "Vietnamese",
  "Other",
] as const;

export const STORE_SECTIONS = [
  "Produce",
  "Meat & Seafood",
  "Dairy",
  "Bakery",
  "Frozen",
  "Bulk & Dry Goods",
  "Canned Goods",
  "Condiments & Oils",
  "Beverages",
  "Household",
] as const;

export const UNITS = [
  "whole",
  "g",
  "kg",
  "ml",
  "l",
  "tsp",
  "tbsp",
  "cup",
  "oz",
  "lb",
  "pinch",
  "bunch",
  "can",
  "clove",
  "slice",
] as const;

export const DIETARY_TAGS = [
  "vegetarian",
  "vegan",
  "gluten-free",
  "dairy-free",
  "nut-free",
  "low-carb",
  "keto",
  "paleo",
] as const;

export const CALENDAR_DAYS = 5;
