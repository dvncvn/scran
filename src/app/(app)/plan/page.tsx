"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { formatDate, addDays, getDateRange } from "../../../../lib/dates";
import { CALENDAR_DAYS } from "../../../../lib/constants";
import { DayColumn } from "../../../../components/features/DayColumn";
import { Id } from "../../../../convex/_generated/dataModel";

export default function PlanPage() {
  const user = useQuery(api.functions.users.currentUser);
  const [startDate, setStartDate] = useState(() => new Date());

  const dates = getDateRange(startDate, CALENDAR_DAYS);
  const startStr = dates[0];
  const endStr = dates[dates.length - 1];

  const mealPlans = useQuery(
    api.functions.mealPlans.getForDateRange,
    user?.householdId
      ? {
          householdId: user.householdId as Id<"households">,
          startDate: startStr,
          endDate: endStr,
        }
      : "skip"
  );

  if (!user?.householdId) return null;

  const plansByDate = new Map(
    (mealPlans ?? []).map((plan) => [plan.date, plan])
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Meal Plan</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStartDate((d) => addDays(d, -CALENDAR_DAYS))}
            className="px-3 py-1.5 text-sm rounded-md border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            aria-label="Previous days"
          >
            &larr;
          </button>
          <button
            onClick={() => setStartDate(new Date())}
            className="px-3 py-1.5 text-sm rounded-md border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Today
          </button>
          <button
            onClick={() => setStartDate((d) => addDays(d, CALENDAR_DAYS))}
            className="px-3 py-1.5 text-sm rounded-md border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
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
          />
        ))}
      </div>
    </div>
  );
}
