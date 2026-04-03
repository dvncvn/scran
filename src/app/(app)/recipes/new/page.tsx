"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { RecipeForm } from "../../../../../components/features/RecipeForm";

export default function NewRecipePage() {
  const user = useQuery(api.functions.users.currentUser);

  if (!user?.householdId) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-xl font-semibold tracking-tight mb-6">
        New Recipe
      </h1>
      <RecipeForm
        householdId={user.householdId as Id<"households">}
        userId={user._id}
      />
    </div>
  );
}
