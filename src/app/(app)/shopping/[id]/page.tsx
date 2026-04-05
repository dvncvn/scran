"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { ShoppingChecklist } from "../../../../../components/features/ShoppingChecklist";
import { ManualItemInput } from "../../../../../components/features/ManualItemInput";

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  const opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
  return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", opts)}`;
}

export default function ShoppingListDetailPage() {
  const params = useParams();
  const listId = params.id as Id<"shoppingLists">;
  const list = useQuery(api.functions.shoppingLists.get, { id: listId });
  const regenerate = useMutation(api.functions.shoppingLists.regenerate);

  // Collect unique recipe IDs from all items for name lookup
  const recipeIds = useMemo(() => {
    if (!list) return [];
    const ids = new Set<string>();
    for (const item of list.items) {
      for (const id of item.sourceRecipeIds) ids.add(id);
    }
    return [...ids] as Id<"recipes">[];
  }, [list]);

  const recipeNames = useQuery(
    api.functions.recipes.getNamesByIds,
    list?.householdId && recipeIds.length > 0
      ? { householdId: list.householdId, ids: recipeIds }
      : "skip"
  );

  const [editing, setEditing] = useState(false);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [regenerating, setRegenerating] = useState(false);

  if (list === undefined) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (list === null) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-sm text-zinc-500">Shopping list not found</p>
        <Link href="/shopping" className="text-sm underline text-zinc-900 dark:text-zinc-100 mt-2 inline-block">
          Back to shopping
        </Link>
      </div>
    );
  }

  const handleStartEdit = () => {
    setEditStart(list.dateRangeStart);
    setEditEnd(list.dateRangeEnd);
    setEditing(true);
  };

  const handleRegenerate = async () => {
    if (!editStart || !editEnd || editStart > editEnd) return;
    setRegenerating(true);
    try {
      await regenerate({ listId: list._id, startDate: editStart, endDate: editEnd });
      setEditing(false);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-1">
        <Link
          href="/shopping"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          &larr; Shopping
        </Link>
      </div>

      <h1 className="text-xl font-semibold tracking-tight mb-1">
        Shopping List
      </h1>

      {editing ? (
        <div className="mb-6 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="flex-1">
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">From</label>
              <input
                type="date"
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">To</label>
              <input
                type="date"
                value={editEnd}
                onChange={(e) => setEditEnd(e.target.value)}
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRegenerate}
              disabled={regenerating || !editStart || !editEnd || editStart > editEnd}
              className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {regenerating ? "Updating..." : "Update dates"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-md px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleStartEdit}
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 inline-flex items-center gap-1"
        >
          {formatDateRange(list.dateRangeStart, list.dateRangeEnd)}
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
          </svg>
        </button>
      )}

      <ShoppingChecklist list={list} recipeNames={recipeNames ?? {}} />

      <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <ManualItemInput listId={list._id} />
      </div>
    </div>
  );
}
