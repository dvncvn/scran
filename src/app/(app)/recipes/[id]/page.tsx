"use client";

import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useEscapeKey } from "../../../../../hooks/useEscapeKey";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { RecipeForm } from "../../../../../components/features/RecipeForm";
import { formatQuantity } from "../../../../../lib/fractions";

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.id as Id<"recipes">;
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const recipe = useQuery(api.functions.recipes.get, { id: recipeId });
  const user = useQuery(api.functions.users.currentUser);
  const chef = useQuery(
    api.functions.chefs.get,
    recipe?.chefId ? { id: recipe.chefId } : "skip"
  );
  const removeRecipe = useMutation(api.functions.recipes.remove);

  useEscapeKey(() => setShowDeleteConfirm(false), showDeleteConfirm);

  if (recipe === undefined || user === undefined) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-sm text-zinc-500">Loading recipe…</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-sm text-zinc-500">Recipe not found</div>
      </div>
    );
  }

  if (isEditing && user?.householdId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-xl font-semibold tracking-tight mb-6">
          Edit Recipe
        </h1>
        <RecipeForm
          householdId={user.householdId as Id<"households">}
          userId={user._id}
          onSave={() => setIsEditing(false)}
          initialData={{
            id: recipe._id,
            name: recipe.name,
            ingredients: recipe.ingredients,
            steps: recipe.steps,
            servings: recipe.servings,
            chefId: recipe.chefId,
            chefName: chef?.name,
            mealTypes: recipe.mealTypes,
            cuisineType: recipe.cuisineType,
            dietaryTags: recipe.dietaryTags,
            effortLevel: recipe.effortLevel,
            indulgenceLevel: recipe.indulgenceLevel,
            sourceUrl: recipe.sourceUrl,
            cookbookRef: recipe.cookbookRef,
            calories: recipe.calories,
            proteinGrams: recipe.proteinGrams,
            fatGrams: recipe.fatGrams,
            carbGrams: recipe.carbGrams,
          }}
        />
      </div>
    );
  }

  async function handleDelete() {
    await removeRecipe({ id: recipeId });
    router.push("/recipes");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {recipe.name}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500">
              {chef?.name && <span>{chef.name}</span>}
              {recipe.mealTypes && recipe.mealTypes.length > 0 && (
                <span>{recipe.mealTypes.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")}</span>
              )}
              {recipe.cuisineType && <span>{recipe.cuisineType}</span>}
              {recipe.effortLevel && <span>{recipe.effortLevel}</span>}
              {recipe.indulgenceLevel && <span>{recipe.indulgenceLevel}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Rating */}
        {recipe.householdRating && (
          <div className="mb-4 text-sm">
            {"★".repeat(recipe.householdRating)}
            {"☆".repeat(5 - recipe.householdRating)}
          </div>
        )}

        {/* Dietary tags */}
        {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {recipe.dietaryTags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Servings */}
        <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          Serves {recipe.servings}
          {recipe.timesCooked > 0 && (
            <span className="ml-3">
              Cooked {recipe.timesCooked} time
              {recipe.timesCooked !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Ingredients */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-2">Ingredients</h2>
          <ul className="space-y-1">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {formatQuantity(ing.quantity)} {ing.unit}
                </span>{" "}
                {ing.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        {recipe.steps.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold mb-2">Steps</h2>
            <ol className="space-y-3">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="text-zinc-400 shrink-0">{i + 1}.</span>
                  <div>
                    <p>{step.instruction}</p>
                    {step.durationMinutes && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {step.durationMinutes} min
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Nutrition */}
        {(recipe.calories ||
          recipe.proteinGrams ||
          recipe.fatGrams ||
          recipe.carbGrams) && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold mb-2">
              Nutrition (per serving)
            </h2>
            <div className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
              {recipe.calories && <span>{recipe.calories} cal</span>}
              {recipe.proteinGrams && <span>{recipe.proteinGrams}g protein</span>}
              {recipe.fatGrams && <span>{recipe.fatGrams}g fat</span>}
              {recipe.carbGrams && <span>{recipe.carbGrams}g carbs</span>}
            </div>
          </div>
        )}

        {/* Cookbook ref */}
        {recipe.cookbookRef && (
          <div className="text-sm text-zinc-500 mb-6">
            From: {recipe.cookbookRef.title}
            {recipe.cookbookRef.page && <span>, p. {recipe.cookbookRef.page}</span>}
          </div>
        )}

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-sm rounded-lg bg-white dark:bg-zinc-900 shadow-xl p-6">
              <h3 className="text-sm font-semibold mb-2">Delete recipe?</h3>
              <p className="text-sm text-zinc-500 mb-4">
                This will permanently delete &ldquo;{recipe.name}&rdquo;. This
                can&rsquo;t be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
