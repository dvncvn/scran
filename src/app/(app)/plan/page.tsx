"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useMemo, useState } from "react";
import { addDays, getDateRange } from "../../../../lib/dates";
import { CALENDAR_DAYS } from "../../../../lib/constants";
import { DayColumn } from "../../../../components/features/DayColumn";
import { Id } from "../../../../convex/_generated/dataModel";
import { collectRecipeIdsFromPlans } from "../../../../lib/mealPlanRecipes";

export default function PlanPage() {
  const user = useQuery(api.functions.users.currentUser);
  const [startDate, setStartDate] = useState(() => new Date());

  const dates = getDateRange(startDate, CALENDAR_DAYS);
  const startStr = dates[0];
  const endStr = dates[dates.length - 1];

  const householdId = user?.householdId as Id<"households"> | undefined;

  const mealPlans = useQuery(
    api.functions.mealPlans.getForDateRange,
    householdId
      ? {
          householdId,
          startDate: startStr,
          endDate: endStr,
        }
      : "skip"
  );

  const recipeIds = useMemo(
    () => (mealPlans ? collectRecipeIdsFromPlans(mealPlans) : []),
    [mealPlans]
  );

  const recipeNames = useQuery(
    api.functions.recipes.getNamesByIds,
    householdId && recipeIds.length > 0
      ? { householdId, ids: recipeIds }
      : "skip"
  );

  if (!user?.householdId) return null;

  const plansByDate = new Map(
    (mealPlans ?? []).map((plan) => [plan.date, plan])
  );

  const recipeNamesMap = recipeNames ?? {};
  const recipeNamesLoading = recipeIds.length > 0 && recipeNames === undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Plan</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStartDate((d) => addDays(d, -CALENDAR_DAYS))}
            className="px-3 py-1.5 text-sm rounded-md text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Previous days"
          >
            &larr;
          </button>
          <button
            onClick={() => setStartDate(new Date())}
            className="px-3 py-1.5 text-sm rounded-md text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Today
          </button>
          <button
            onClick={() => setStartDate((d) => addDays(d, CALENDAR_DAYS))}
            className="px-3 py-1.5 text-sm rounded-md text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Next days"
          >
            &rarr;
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {dates.map((date) => (
          <DayColumn
            key={date}
            date={date}
            plan={plansByDate.get(date) ?? null}
            householdId={user.householdId as Id<"households">}
            userId={user._id}
            recipeNames={recipeNamesMap}
            recipeNamesLoading={recipeNamesLoading}
          />
        ))}
      </div>
    </div>
  );
}
