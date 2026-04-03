"use client";

import { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { SlotType } from "../../lib/constants";
import { SlotAssignModal } from "./SlotAssignModal";
import { UndoToast } from "../ui/UndoToast";

interface MealSlotProps {
  date: string;
  slotType: SlotType;
  slot: {
    slotType: string;
    entryType: string;
    recipeId?: Id<"recipes">;
    freeformText?: string;
    assignedBy: Id<"users">;
    assignedAt: number;
  } | null;
  householdId: Id<"households">;
  userId: Id<"users">;
}

const slotLabels: Record<SlotType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export function MealSlot({
  date,
  slotType,
  slot,
  householdId,
  userId,
}: MealSlotProps) {
  const [showModal, setShowModal] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState(false);
  const removeSlot = useMutation(api.functions.mealPlans.removeSlot);
  const assignSlot = useMutation(api.functions.mealPlans.assignSlot);

  // Fetch recipe name if this slot has a recipe
  const recipe = useQuery(
    api.functions.recipes.get,
    slot?.recipeId ? { id: slot.recipeId } : "skip"
  );

  const displayText =
    slot?.entryType === "recipe"
      ? recipe?.name ?? "Loading..."
      : slot?.entryType === "freeform" || slot?.entryType === "leftover"
        ? slot.freeformText
        : null;

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    setPendingRemoval(true);
  }

  const handleConfirmRemoval = useCallback(async () => {
    await removeSlot({ householdId, date, slotType });
    setPendingRemoval(false);
  }, [removeSlot, householdId, date, slotType]);

  const handleUndoRemoval = useCallback(() => {
    setPendingRemoval(false);
  }, []);

  // If pending removal, show as empty (optimistic)
  const isVisible = slot && !pendingRemoval;

  return (
    <>
      <div
        onClick={() => !isVisible && setShowModal(true)}
        className={`rounded-md px-2 py-1.5 text-xs min-h-[36px] flex items-center ${
          isVisible
            ? "bg-zinc-100 dark:bg-zinc-800"
            : "border border-dashed border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
        }`}
      >
        {isVisible ? (
          <div className="flex items-center justify-between w-full gap-1">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 mb-0.5">
                {slotLabels[slotType]}
              </div>
              {slot.entryType === "recipe" && slot.recipeId ? (
                <a
                  href={`/recipes/${slot.recipeId}`}
                  className="text-zinc-900 dark:text-zinc-100 hover:underline truncate block"
                  onClick={(e) => e.stopPropagation()}
                >
                  {displayText}
                </a>
              ) : (
                <span className="text-zinc-700 dark:text-zinc-300 truncate block">
                  {displayText}
                </span>
              )}
            </div>
            <button
              onClick={handleRemove}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 shrink-0 p-0.5"
              aria-label={`Remove ${slotLabels[slotType]}`}
            >
              &times;
            </button>
          </div>
        ) : (
          <span className="text-zinc-400 text-[10px] uppercase tracking-wider">
            {slotLabels[slotType]}
          </span>
        )}
      </div>

      {showModal && (
        <SlotAssignModal
          date={date}
          slotType={slotType}
          householdId={householdId}
          userId={userId}
          onClose={() => setShowModal(false)}
        />
      )}

      {pendingRemoval && (
        <UndoToast
          message={`Removed ${displayText ?? slotLabels[slotType]}`}
          onUndo={handleUndoRemoval}
          onExpire={handleConfirmRemoval}
        />
      )}
    </>
  );
}
