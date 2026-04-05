"use client";

import { useMemo, useState } from "react";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { SlotType } from "../../lib/constants";
import { getDayName, getDisplayDate } from "../../lib/dates";

interface SlotAssignModalProps {
  date: string;
  slotType: SlotType;
  householdId: Id<"households">;
  userId: Id<"users">;
  onClose: () => void;
}

const slotLabels: Record<SlotType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export function SlotAssignModal({
  date,
  slotType,
  householdId,
  userId,
  onClose,
}: SlotAssignModalProps) {
  const [inputValue, setInputValue] = useState("");

  // Single stable subscription — fetch all recipes for this slot type, filter client-side
  const allRecipes = useQuery(api.functions.recipes.search, {
    householdId,
    query: "",
    mealType: slotType,
  });

  const recipes = useMemo(() => {
    if (!allRecipes) return undefined;
    const trimmed = inputValue.trim().toLowerCase();
    if (!trimmed) return allRecipes;
    return allRecipes.filter(
      (r) =>
        r.name.toLowerCase().includes(trimmed) ||
        r.chefName?.toLowerCase().includes(trimmed)
    );
  }, [allRecipes, inputValue]);

  const assignSlot = useMutation(api.functions.mealPlans.assignSlot);

  async function handleAssignRecipe(recipeId: Id<"recipes">) {
    await assignSlot({
      householdId,
      date,
      slot: {
        slotType,
        entryType: "recipe",
        recipeId,
        assignedBy: userId,
        assignedAt: Date.now(),
      },
    });
    onClose();
  }

  async function handleAssignFreeform(text: string) {
    if (!text.trim()) return;
    await assignSlot({
      householdId,
      date,
      slot: {
        slotType,
        entryType: "freeform",
        freeformText: text.trim(),
        assignedBy: userId,
        assignedAt: Date.now(),
      },
    });
    onClose();
  }

  async function handleAssignLeftovers() {
    await assignSlot({
      householdId,
      date,
      slot: {
        slotType,
        entryType: "leftover",
        freeformText: "Leftovers",
        assignedBy: userId,
        assignedAt: Date.now(),
      },
    });
    onClose();
  }

  const hasInput = inputValue.trim().length > 0;
  const hasRecipeResults = recipes && recipes.length > 0;
  const showQuickOptions = hasInput && !hasRecipeResults;

  useEscapeKey(onClose, true);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-lg bg-white dark:bg-zinc-900 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="slot-assign-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-4 py-3">
          <h2 id="slot-assign-title" className="text-sm font-semibold">
            Add {slotLabels[slotType]} for {getDayName(date)}, {getDisplayDate(date)}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            &times;
          </button>
        </div>

        <div className="px-4 py-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search recipes or type a quick meal..."
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 mb-2"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && hasInput && !hasRecipeResults) {
                handleAssignFreeform(inputValue);
              }
            }}
          />

          <div className="max-h-56 overflow-y-auto">
            {/* Recipe results while typing */}
            {hasInput &&
              hasRecipeResults &&
              recipes.map((recipe) => (
                <button
                  key={recipe._id}
                  onClick={() => handleAssignRecipe(recipe._id)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md"
                >
                  <div className="font-medium">{recipe.name}</div>
                  <div className="text-xs text-zinc-500">
                    {[recipe.chefName, recipe.cuisineType].filter(Boolean).join(" · ")}
                  </div>
                </button>
              ))}

            {/* Quick add options when no recipes match */}
            {showQuickOptions && (
              <div className="space-y-1">
                <button
                  onClick={() => handleAssignFreeform(inputValue)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md flex items-center gap-2"
                >
                  <span className="text-zinc-400 text-xs">+</span>
                  <span>
                    Add <span className="font-medium">&ldquo;{inputValue.trim()}&rdquo;</span> as a quick meal
                  </span>
                </button>
                <a
                  href="/recipes/new"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md flex items-center gap-2 block"
                >
                  <span className="text-zinc-400 text-xs">+</span>
                  <span>Create a new recipe</span>
                </a>
              </div>
            )}

            {/* Empty state — no input yet */}
            {!hasInput && (
              <div className="space-y-1">
                {recipes && recipes.length > 0 ? (
                  recipes.map((recipe) => (
                    <button
                      key={recipe._id}
                      onClick={() => handleAssignRecipe(recipe._id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md"
                    >
                      <div className="font-medium">{recipe.name}</div>
                      <div className="text-xs text-zinc-500">
                        {[recipe.chefName, recipe.cuisineType].filter(Boolean).join(" · ")}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-3 text-center text-sm text-zinc-500">
                    No recipes yet.{" "}
                    <a
                      href="/recipes/new"
                      className="text-zinc-900 dark:text-zinc-100 underline"
                    >
                      Add one
                    </a>
                  </div>
                )}

                {/* Quick options always visible */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-1">
                  <button
                    onClick={handleAssignLeftovers}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-md text-zinc-500"
                  >
                    Leftovers
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
