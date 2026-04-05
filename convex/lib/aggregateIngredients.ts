import type { Id } from "../_generated/dataModel";

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  storeSection?: string;
  isStaple?: boolean;
}

interface AggregatedItem {
  name: string;
  quantity: number;
  unit: string;
  storeSection: string;
  sourceRecipeIds: Id<"recipes">[];
  checked: boolean;
}

interface RecipeIngredients {
  recipeId: Id<"recipes">;
  ingredients: Ingredient[];
}

const DEFAULT_SECTION = "Other";

// Keyword → store section mapping for auto-categorization.
// Checked against the lowercased ingredient name. First match wins.
// Longer/more-specific phrases should come before shorter substrings
// to avoid false positives (e.g. "apple sauce" before "apple").
const SECTION_KEYWORDS: [string[], string][] = [
  // Meat & Seafood
  [["chicken", "beef", "pork", "lamb", "steak", "mince", "ground beef", "ground turkey",
    "turkey", "bacon", "sausage", "ham", "prosciutto", "pancetta", "chorizo",
    "salmon", "tuna", "shrimp", "prawn", "cod", "fish", "tilapia", "halibut",
    "crab", "lobster", "mussel", "clam", "anchov", "scallop", "squid"], "Meat & Seafood"],
  // Produce
  [["onion", "garlic", "ginger", "potato", "carrot", "celery",
    "jalapeño", "jalapeno", "cucumber", "lettuce",
    "spinach", "kale", "broccoli", "cauliflower", "zucchini", "courgette",
    "aubergine", "eggplant", "mushroom", "bean sprout",
    "avocado", "lemon", "lime",
    "blueberr", "strawberr", "raspberr", "mango", "pineapple", "peach",
    "pear", "grape", "melon", "watermelon", "banana",
    "herbs", "basil", "cilantro", "parsley", "rosemary", "thyme", "dill",
    "chive", "spring onion", "scallion", "shallot", "leek", "cabbage",
    "beetroot", "beet", "radish", "turnip", "sweet potato", "squash",
    "pumpkin", "asparagus", "artichoke", "fennel", "rocket", "arugula",
    "watercress", "bok choy", "pak choi", "tomato", "pepper", "chilli",
    "chili", "corn", "pea", "orange", "apple", "berry", "coconut",
    "coriander", "mint"], "Produce"],
  // Dairy
  [["milk", "cream cheese", "sour cream", "cream", "butter", "cheese",
    "yogurt", "yoghurt", "crème fraîche", "creme fraiche",
    "mozzarella", "parmesan", "parmigiano", "cheddar", "feta", "ricotta",
    "gouda", "brie", "gruyere", "mascarpone", "cottage cheese", "egg"], "Dairy"],
  // Bakery
  [["bread", "baguette", "croissant", "pita", "naan", "tortilla",
    "wrap", "bun", "bagel", "ciabatta", "sourdough", "flatbread", "roll"], "Bakery"],
  // Frozen
  [["frozen", "ice cream"], "Frozen"],
  // Canned Goods
  [["canned", "tinned", "can of", "tin of", "diced tomatoes", "crushed tomatoes",
    "tomato paste", "tomato sauce", "passata", "coconut milk", "chickpea",
    "kidney bean", "black bean", "lentil", "baked bean", "apple sauce",
    "applesauce"], "Canned Goods"],
  // Condiments & Oils
  [["olive oil", "vegetable oil", "sesame oil", "oil", "vinegar", "soy sauce",
    "fish sauce", "worcestershire", "hot sauce", "sriracha", "ketchup",
    "mustard", "mayonnaise", "mayo", "honey", "maple syrup", "mirin",
    "tahini", "pesto", "salsa", "chutney", "jam", "marmalade",
    "dressing", "relish", "bbq sauce", "teriyaki"], "Condiments & Oils"],
  // Snacks (maps to Bulk & Dry Goods since no dedicated section)
  [["chips", "crisps", "crackers", "popcorn", "pretzel", "trail mix",
    "granola bar", "protein bar", "snack"], "Bulk & Dry Goods"],
  // Bulk & Dry Goods
  [["rice", "pasta", "noodle", "spaghetti", "penne", "fusilli", "macaroni",
    "flour", "sugar", "salt", "paprika", "cumin", "cinnamon",
    "turmeric", "oregano", "nutmeg", "coriander seed", "chili powder",
    "curry powder", "garam masala", "bay leaf", "stock", "broth", "bouillon",
    "baking powder", "baking soda", "bicarb", "yeast", "cornstarch",
    "cornflour", "breadcrumb", "panko", "oat", "cereal", "granola",
    "quinoa", "couscous", "bulgur", "polenta", "almond", "walnut", "pecan",
    "cashew", "peanut", "pistachio", "pine nut", "sesame seed", "chia",
    "flaxseed", "dried", "raisin", "sultana", "cranberr", "chocolate",
    "cocoa", "vanilla", "nut"], "Bulk & Dry Goods"],
  // Beverages
  [["sparkling water", "juice", "wine", "beer", "coffee", "tea", "soda",
    "water", "sparkling", "kombucha", "lemonade", "cola", "tonic",
    "energy drink", "smoothie"], "Beverages"],
  // Household
  [["paper towel", "toilet paper", "trash bag", "garbage bag", "foil",
    "plastic wrap", "parchment", "napkin", "sponge", "dish soap",
    "detergent", "cleaning"], "Household"],
];

export function inferStoreSection(ingredientName: string): string {
  const lower = ingredientName.toLowerCase();
  for (const [keywords, section] of SECTION_KEYWORDS) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) return section;
    }
  }
  return DEFAULT_SECTION;
}

/**
 * Aggregate ingredients across multiple recipe occurrences.
 * Same name + same unit = summed quantities.
 * Different units = separate line items.
 * Pantry staples and isStaple ingredients are excluded.
 */
export function aggregateIngredients(
  recipeIngredients: RecipeIngredients[],
  pantryStapleNames: Set<string>
): AggregatedItem[] {
  const map = new Map<
    string,
    { displayName: string; quantity: number; unit: string; storeSection: string; recipeIds: Set<string> }
  >();

  for (const { recipeId, ingredients } of recipeIngredients) {
    for (const ing of ingredients) {
      if (ing.isStaple) continue;

      const normalized = ing.name.trim().toLowerCase();
      if (pantryStapleNames.has(normalized)) continue;

      const key = `${normalized}|${ing.unit}`;
      const existing = map.get(key);

      if (existing) {
        existing.quantity += ing.quantity;
        existing.recipeIds.add(recipeId);
      } else {
        map.set(key, {
          displayName: ing.name.trim(),
          quantity: ing.quantity,
          unit: ing.unit,
          storeSection: ing.storeSection || inferStoreSection(ing.name),
          recipeIds: new Set([recipeId]),
        });
      }
    }
  }

  return Array.from(map.values()).map((entry) => ({
    name: entry.displayName,
    quantity: entry.quantity,
    unit: entry.unit,
    storeSection: entry.storeSection,
    sourceRecipeIds: Array.from(entry.recipeIds) as Id<"recipes">[],
    checked: false,
  }));
}
