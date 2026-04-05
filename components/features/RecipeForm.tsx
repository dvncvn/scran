"use client";

import { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { ChefInput } from "./ChefInput";
import {
  CUISINE_TYPES,
  EFFORT_LEVELS,
  INDULGENCE_LEVELS,
  DIETARY_TAGS,
  MEAL_TYPES,
  UNITS,
  STORE_SECTIONS,
} from "../../lib/constants";
import { parseFraction, formatQuantity } from "../../lib/fractions";

interface IngredientData {
  name: string;
  quantity: number;
  unit: string;
  storeSection?: string;
}

interface IngredientFormRow {
  name: string;
  quantityText: string;
  unit: string;
  storeSection?: string;
}

interface Step {
  order: number;
  instruction: string;
  durationMinutes?: number;
}

interface RecipeFormProps {
  householdId: Id<"households">;
  userId: Id<"users">;
  initialData?: {
    id: Id<"recipes">;
    name: string;
    ingredients: IngredientData[];
    steps: Step[];
    servings: number;
    chefId?: Id<"chefs">;
    chefName?: string;
    mealTypes?: string[];
    cuisineType?: string;
    dietaryTags?: string[];
    effortLevel?: string;
    indulgenceLevel?: string;
    sourceUrl?: string;
    cookbookRef?: { title: string; page?: number };
    calories?: number;
    proteinGrams?: number;
    fatGrams?: number;
    carbGrams?: number;
  };
  onSave?: () => void;
}

export function RecipeForm({
  householdId,
  userId,
  initialData,
  onSave,
}: RecipeFormProps) {
  const router = useRouter();
  const createRecipe = useMutation(api.functions.recipes.create);
  const updateRecipe = useMutation(api.functions.recipes.update);

  const [name, setName] = useState(initialData?.name ?? "");
  const [ingredients, setIngredients] = useState<IngredientFormRow[]>(
    initialData?.ingredients.map((ing) => ({
      name: ing.name,
      quantityText: formatQuantity(ing.quantity),
      unit: ing.unit,
      storeSection: ing.storeSection,
    })) ?? [{ name: "", quantityText: "1", unit: "whole" }]
  );
  const [steps, setSteps] = useState<Step[]>(
    initialData?.steps ?? [{ order: 1, instruction: "" }]
  );
  const [servings, setServings] = useState(initialData?.servings ?? 4);
  const [chefValue, setChefValue] = useState<{
    id?: Id<"chefs">;
    name: string;
  }>({
    id: initialData?.chefId,
    name: initialData?.chefName ?? "",
  });
  const getOrCreateChef = useMutation(api.functions.chefs.getOrCreate);
  const [sourceType, setSourceType] = useState<"cookbook" | "url">(
    initialData?.sourceUrl ? "url" : "cookbook"
  );
  const [sourceUrl, setSourceUrl] = useState(initialData?.sourceUrl ?? "");
  const [cookbookTitle, setCookbookTitle] = useState(
    initialData?.cookbookRef?.title ?? ""
  );
  const [cookbookPage, setCookbookPage] = useState<number | undefined>(
    initialData?.cookbookRef?.page
  );
  const [mealTypes, setMealTypes] = useState<string[]>(
    initialData?.mealTypes ?? []
  );
  const [cuisineType, setCuisineType] = useState(
    initialData?.cuisineType ?? ""
  );
  const [dietaryTags, setDietaryTags] = useState<string[]>(
    initialData?.dietaryTags ?? []
  );
  const [effortLevel, setEffortLevel] = useState(
    initialData?.effortLevel ?? ""
  );
  const [indulgenceLevel, setIndulgenceLevel] = useState(
    initialData?.indulgenceLevel ?? ""
  );
  const [calories, setCalories] = useState<number | undefined>(
    initialData?.calories
  );
  const [proteinGrams, setProteinGrams] = useState<number | undefined>(
    initialData?.proteinGrams
  );
  const [fatGrams, setFatGrams] = useState<number | undefined>(
    initialData?.fatGrams
  );
  const [carbGrams, setCarbGrams] = useState<number | undefined>(
    initialData?.carbGrams
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Duplicate detection
  const [nameForCheck, setNameForCheck] = useState("");
  const similarNames = useQuery(
    api.functions.recipes.findSimilarNames,
    nameForCheck.trim()
      ? { householdId, name: nameForCheck }
      : "skip"
  );
  const duplicates = similarNames?.filter(
    (r) => !initialData || r._id !== initialData.id
  );

  const handleNameBlur = useCallback(() => {
    setNameForCheck(name);
  }, [name]);

  function addIngredient() {
    setIngredients([
      ...ingredients,
      { name: "", quantityText: "1", unit: "whole" },
    ]);
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function updateIngredient(index: number, updates: Partial<IngredientFormRow>) {
    setIngredients(
      ingredients.map((ing, i) => (i === index ? { ...ing, ...updates } : ing))
    );
  }

  function addStep() {
    setSteps([
      ...steps,
      { order: steps.length + 1, instruction: "" },
    ]);
  }

  function removeStep(index: number) {
    setSteps(
      steps
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, order: i + 1 }))
    );
  }

  function updateStep(index: number, updates: Partial<Step>) {
    setSteps(steps.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  }

  function moveStep(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= steps.length) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    setSteps(newSteps.map((s, i) => ({ ...s, order: i + 1 })));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const validIngredients = ingredients
        .filter((i) => i.name.trim())
        .map((i) => ({
          name: i.name,
          quantity: parseFraction(i.quantityText) || 0,
          unit: i.unit,
          storeSection: i.storeSection,
        }));
      const validSteps = steps.filter((s) => s.instruction.trim());

      // Resolve chef — create if new, reuse if existing
      let chefId: Id<"chefs"> | undefined;
      if (chefValue.name.trim()) {
        if (chefValue.id) {
          chefId = chefValue.id;
        } else {
          chefId = await getOrCreateChef({
            householdId,
            name: chefValue.name.trim(),
            addedBy: userId,
          });
        }
      }

      const data = {
        name,
        ingredients: validIngredients,
        steps: validSteps.map((s, i) => ({ ...s, order: i + 1 })),
        servings,
        chefId,
        mealTypes:
          mealTypes.length > 0
            ? (mealTypes as ("breakfast" | "lunch" | "dinner" | "snack")[])
            : undefined,
        cuisineType: cuisineType || undefined,
        dietaryTags: dietaryTags.length > 0 ? dietaryTags : undefined,
        effortLevel: (effortLevel || undefined) as
          | "easy"
          | "medium"
          | "involved"
          | "project"
          | undefined,
        indulgenceLevel: (indulgenceLevel || undefined) as
          | "healthy"
          | "balanced"
          | "indulgent"
          | "special-occasion"
          | undefined,
        sourceUrl: sourceType === "url" && sourceUrl.trim() ? sourceUrl.trim() : undefined,
        cookbookRef:
          sourceType === "cookbook" && cookbookTitle.trim()
            ? { title: cookbookTitle.trim(), page: cookbookPage }
            : undefined,
        calories,
        proteinGrams,
        fatGrams,
        carbGrams,
      };

      if (initialData) {
        await updateRecipe({ id: initialData.id, ...data });
        if (onSave) {
          onSave();
        } else {
          router.replace(`/recipes/${initialData.id}`);
        }
      } else {
        const id = await createRecipe({
          ...data,
          householdId,
          addedBy: userId,
          source: sourceType === "url" && sourceUrl.trim() ? "url" : "manual",
        });
        router.replace(`/recipes/${id}`);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to save recipe:", error);
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
          placeholder="Be descriptive — e.g., 'Crispy Peanut Tofu with Rice' not just 'Tofu'"
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
          required
        />
        {duplicates && duplicates.length > 0 && (
          <div className="mt-1 rounded-md bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 text-xs text-yellow-800 dark:text-yellow-200">
            Similar recipe found:{" "}
            {duplicates.map((r) => r.name).join(", ")}. Is this a
            duplicate?
          </div>
        )}
      </div>

      {/* Source */}
      <div className="space-y-3">
        <ChefInput
          householdId={householdId}
          value={chefValue}
          onChange={setChefValue}
        />
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium">From</label>
            <div className="flex rounded-md border border-zinc-200 dark:border-zinc-700 text-sm">
              <button
                type="button"
                onClick={() => setSourceType("cookbook")}
                className={`px-3 py-1 rounded-l-md ${
                  sourceType === "cookbook"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                Cookbook
              </button>
              <button
                type="button"
                onClick={() => setSourceType("url")}
                className={`px-3 py-1 rounded-r-md ${
                  sourceType === "url"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                URL
              </button>
            </div>
          </div>
          {sourceType === "cookbook" ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={cookbookTitle}
                onChange={(e) => setCookbookTitle(e.target.value)}
                placeholder="Book title"
                className="flex-1 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <input
                type="number"
                value={cookbookPage ?? ""}
                onChange={(e) =>
                  setCookbookPage(
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                placeholder="Page"
                className="w-20 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                min={1}
              />
            </div>
          ) : (
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          )}
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <label className="block text-sm font-medium mb-2">Ingredients</label>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                type="text"
                value={ing.name}
                onChange={(e) =>
                  updateIngredient(i, { name: e.target.value })
                }
                placeholder="Ingredient"
                className="flex-1 rounded-md border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <input
                type="text"
                inputMode="numeric"
                value={ing.quantityText}
                onChange={(e) =>
                  updateIngredient(i, { quantityText: e.target.value })
                }
                placeholder="1"
                className="w-16 rounded-md border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <select
                value={ing.unit}
                onChange={(e) =>
                  updateIngredient(i, { unit: e.target.value })
                }
                className="w-20 rounded-md border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <select
                value={ing.storeSection ?? ""}
                onChange={(e) =>
                  updateIngredient(i, {
                    storeSection: e.target.value || undefined,
                  })
                }
                className="w-32 rounded-md border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 hidden sm:block"
              >
                <option value="">Section</option>
                {STORE_SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeIngredient(i)}
                className="text-zinc-400 hover:text-zinc-600 px-1 py-1.5"
                aria-label="Remove ingredient"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIngredient}
          className="mt-2 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          + Add ingredient
        </button>
      </div>

      {/* Steps */}
      <div>
        <label className="block text-sm font-medium mb-2">Steps</label>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-xs text-zinc-400 pt-2 w-5 shrink-0">
                {i + 1}.
              </span>
              <textarea
                value={step.instruction}
                onChange={(e) =>
                  updateStep(i, { instruction: e.target.value })
                }
                placeholder="Describe this step..."
                className="flex-1 rounded-md border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 min-h-[60px]"
                rows={2}
              />
              <input
                type="number"
                value={step.durationMinutes ?? ""}
                onChange={(e) =>
                  updateStep(i, {
                    durationMinutes: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                placeholder="min"
                className="w-16 rounded-md border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                min={0}
              />
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveStep(i, -1)}
                  disabled={i === 0}
                  className="text-zinc-400 hover:text-zinc-600 disabled:opacity-30 text-xs px-1"
                  aria-label="Move step up"
                >
                  &uarr;
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(i, 1)}
                  disabled={i === steps.length - 1}
                  className="text-zinc-400 hover:text-zinc-600 disabled:opacity-30 text-xs px-1"
                  aria-label="Move step down"
                >
                  &darr;
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeStep(i)}
                className="text-zinc-400 hover:text-zinc-600 px-1 py-1.5"
                aria-label="Remove step"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addStep}
          className="mt-2 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          + Add step
        </button>
      </div>

      {/* Servings */}
      <div>
        <label htmlFor="servings" className="block text-sm font-medium mb-1">
          Servings <span className="text-red-500">*</span>
        </label>
        <input
          id="servings"
          type="number"
          value={servings}
          onChange={(e) => setServings(parseInt(e.target.value) || 1)}
          min={1}
          className="w-20 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {/* Meal types */}
      <div>
        <label className="block text-sm font-medium mb-2">Meal Types</label>
        <p className="text-xs text-zinc-500 mb-2">
          Which meals is this recipe suitable for? Leave empty to show everywhere.
        </p>
        <div className="flex flex-wrap gap-2">
          {MEAL_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() =>
                setMealTypes((prev) =>
                  prev.includes(type)
                    ? prev.filter((t) => t !== type)
                    : [...prev, type]
                )
              }
              className={`px-3 py-1 rounded-full text-sm border ${
                mealTypes.includes(type)
                  ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Metadata row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Cuisine</label>
          <select
            value={cuisineType}
            onChange={(e) => setCuisineType(e.target.value)}
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Select...</option>
            {CUISINE_TYPES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Effort</label>
          <select
            value={effortLevel}
            onChange={(e) => setEffortLevel(e.target.value)}
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Select...</option>
            {EFFORT_LEVELS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Indulgence</label>
          <select
            value={indulgenceLevel}
            onChange={(e) => setIndulgenceLevel(e.target.value)}
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Select...</option>
            {INDULGENCE_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dietary tags */}
      <div>
        <label className="block text-sm font-medium mb-2">Dietary Tags</label>
        <div className="flex flex-wrap gap-2">
          {DIETARY_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() =>
                setDietaryTags((prev) =>
                  prev.includes(tag)
                    ? prev.filter((t) => t !== tag)
                    : [...prev, tag]
                )
              }
              className={`text-xs px-2.5 py-1 rounded-full border ${
                dietaryTags.includes(tag)
                  ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                  : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>


      {/* Nutrition */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Nutrition per serving (optional)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <input
              type="number"
              value={calories ?? ""}
              onChange={(e) =>
                setCalories(
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              placeholder="Calories"
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              min={0}
            />
          </div>
          <div>
            <input
              type="number"
              value={proteinGrams ?? ""}
              onChange={(e) =>
                setProteinGrams(
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              placeholder="Protein (g)"
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              min={0}
            />
          </div>
          <div>
            <input
              type="number"
              value={fatGrams ?? ""}
              onChange={(e) =>
                setFatGrams(
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              placeholder="Fat (g)"
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              min={0}
            />
          </div>
          <div>
            <input
              type="number"
              value={carbGrams ?? ""}
              onChange={(e) =>
                setCarbGrams(
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              placeholder="Carbs (g)"
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              min={0}
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="rounded-md bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isSubmitting
            ? "Saving..."
            : initialData
              ? "Update Recipe"
              : "Add Recipe"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-zinc-200 px-6 py-2 text-sm dark:border-zinc-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
