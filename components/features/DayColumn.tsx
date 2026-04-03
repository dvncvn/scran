"use client";

import { getDayName, getDisplayDate, isToday } from "../../lib/dates";
import { SLOT_TYPES, SlotType } from "../../lib/constants";
import { MealSlot } from "./MealSlot";
import { Id } from "../../convex/_generated/dataModel";
import { Doc } from "../../convex/_generated/dataModel";

interface DayColumnProps {
  date: string;
  plan: Doc<"mealPlans"> | null;
  householdId: Id<"households">;
  userId: Id<"users">;
}

export function DayColumn({ date, plan, householdId, userId }: DayColumnProps) {
  const today = isToday(date);

  return (
    <div
      className={`rounded-lg border p-3 ${
        today
          ? "border-zinc-900 dark:border-zinc-100"
          : "border-zinc-200 dark:border-zinc-700"
      }`}
    >
      <div className="mb-3">
        <div
          className={`text-xs font-medium uppercase tracking-wider ${
            today ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500"
          }`}
        >
          {getDayName(date)}
        </div>
        <div
          className={`text-sm ${
            today ? "font-semibold" : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          {getDisplayDate(date)}
        </div>
      </div>

      <div className="space-y-2">
        {SLOT_TYPES.map((slotType) => {
          const slot = plan?.slots.find((s) => s.slotType === slotType);
          return (
            <MealSlot
              key={slotType}
              date={date}
              slotType={slotType}
              slot={slot ?? null}
              householdId={householdId}
              userId={userId}
            />
          );
        })}
      </div>
    </div>
  );
}
