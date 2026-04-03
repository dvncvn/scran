"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const effortColors: Record<string, string> = {
  easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  involved:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  project: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function RecipesPage() {
  const user = useQuery(api.functions.users.currentUser);
  const [searchQuery, setSearchQuery] = useState("");

  const recipes = useQuery(
    api.functions.recipes.search,
    user?.householdId
      ? {
          householdId: user.householdId as Id<"households">,
          query: searchQuery,
        }
      : "skip"
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Recipes</h1>
        <Link
          href="/recipes/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          New Recipe
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search recipes..."
          className="w-full max-w-md rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {recipes === undefined ? (
        <p className="text-sm text-zinc-500 py-6">Loading recipes…</p>
      ) : recipes.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-zinc-500 mb-4">
            {searchQuery ? "No recipes found" : "No recipes yet"}
          </p>
          {!searchQuery && (
            <Link
              href="/recipes/new"
              className="text-sm text-zinc-900 dark:text-zinc-100 underline"
            >
              Add your first recipe
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <Link
              key={recipe._id}
              href={`/recipes/${recipe._id}`}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <h2 className="font-medium mb-1">{recipe.name}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                {recipe.cuisineType && (
                  <span className="text-xs text-zinc-500">
                    {recipe.cuisineType}
                  </span>
                )}
                {recipe.effortLevel && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${effortColors[recipe.effortLevel]}`}
                  >
                    {recipe.effortLevel}
                  </span>
                )}
                {recipe.householdRating && (
                  <span className="text-xs text-zinc-500">
                    {"★".repeat(recipe.householdRating)}
                    {"☆".repeat(5 - recipe.householdRating)}
                  </span>
                )}
              </div>
              {recipe.lastCookedAt && (
                <div className="text-xs text-zinc-400 mt-2">
                  Last cooked{" "}
                  {new Date(recipe.lastCookedAt).toLocaleDateString()}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
