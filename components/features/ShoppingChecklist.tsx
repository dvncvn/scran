"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import { STORE_SECTIONS } from "../../lib/constants";
import { formatQuantity } from "../../lib/fractions";

const SECTION_ORDER = [...STORE_SECTIONS, "Other"] as const;

interface ChecklistItem {
  name: string;
  quantity?: number;
  unit?: string;
  storeSection: string;
  checked: boolean;
  index: number;
  isManual: boolean;
  recipeNames?: string[];
}

export function ShoppingChecklist({
  list,
  recipeNames,
}: {
  list: Doc<"shoppingLists">;
  recipeNames: Record<string, string>;
}) {
  const toggleItem = useMutation(api.functions.shoppingLists.toggleItem);
  const removeManualItem = useMutation(
    api.functions.shoppingLists.removeManualItem
  );

  const allItems: ChecklistItem[] = [
    ...list.items.map((item, i) => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      storeSection: item.storeSection,
      checked: item.checked,
      index: i,
      isManual: false,
      recipeNames: item.sourceRecipeIds
        .map((id) => recipeNames[id])
        .filter(Boolean),
    })),
    ...list.manualItems.map((item, i) => ({
      name: item.name,
      storeSection: item.storeSection,
      checked: item.checked,
      index: i,
      isManual: true,
    })),
  ];

  // Group by store section
  const grouped = new Map<string, ChecklistItem[]>();
  for (const item of allItems) {
    const section = item.storeSection;
    if (!grouped.has(section)) grouped.set(section, []);
    grouped.get(section)!.push(item);
  }

  const sortedSections = [...grouped.keys()].sort((a, b) => {
    const ai = SECTION_ORDER.indexOf(a as (typeof SECTION_ORDER)[number]);
    const bi = SECTION_ORDER.indexOf(b as (typeof SECTION_ORDER)[number]);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const totalCount = allItems.length;
  const checkedCount = allItems.filter((i) => i.checked).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {checkedCount}/{totalCount} items
        </span>
        <div className="h-2 flex-1 mx-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100 transition-all"
            style={{
              width: totalCount > 0 ? `${(checkedCount / totalCount) * 100}%` : "0%",
            }}
          />
        </div>
      </div>

      {sortedSections.map((section) => {
        const items = grouped.get(section)!;
        const unchecked = items.filter((i) => !i.checked);
        const checked = items.filter((i) => i.checked);

        return (
          <div key={section} className="mb-6">
            <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
              {section}
            </h3>
            <div className="space-y-1">
              {[...unchecked, ...checked].map((item) => (
                <button
                  key={`${item.isManual ? "m" : "r"}-${item.index}`}
                  onClick={() =>
                    toggleItem({
                      listId: list._id,
                      itemIndex: item.index,
                      isManual: item.isManual,
                    })
                  }
                  className="flex items-start gap-3 w-full text-left px-3 py-2.5 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors min-h-[44px]"
                >
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5 ${
                      item.checked
                        ? "bg-zinc-900 border-zinc-900 dark:bg-zinc-100 dark:border-zinc-100"
                        : "border-zinc-300 dark:border-zinc-600"
                    }`}
                  >
                    {item.checked && (
                      <svg
                        className="w-3 h-3 text-white dark:text-zinc-900"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span
                      className={`text-sm ${
                        item.checked
                          ? "line-through text-zinc-400 dark:text-zinc-500"
                          : "text-zinc-900 dark:text-zinc-100"
                      }`}
                    >
                      {item.name}
                      {item.quantity != null && item.unit && (
                        <span className="text-zinc-400 dark:text-zinc-500 ml-1">
                          {formatQuantity(item.quantity)} {item.unit}
                        </span>
                      )}
                    </span>
                    {item.recipeNames && item.recipeNames.length > 0 && (
                      <span className="block text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                        {item.recipeNames.join(", ")}
                      </span>
                    )}
                  </span>
                  {item.isManual && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeManualItem({
                          listId: list._id,
                          itemIndex: item.index,
                        });
                      }}
                      className="flex-shrink-0 p-1 text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400"
                      aria-label={`Remove ${item.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {totalCount === 0 && (
        <p className="text-sm text-zinc-500 py-6 text-center">
          No items in this list
        </p>
      )}
    </div>
  );
}
