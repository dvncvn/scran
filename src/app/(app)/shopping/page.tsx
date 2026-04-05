"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { formatDate, addDays } from "../../../../lib/dates";
import { CALENDAR_DAYS } from "../../../../lib/constants";

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", opts)}`;
}

function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ShoppingPage() {
  const user = useQuery(api.functions.users.currentUser);
  const router = useRouter();

  const today = new Date();
  const defaultStart = formatDate(today);
  const defaultEnd = formatDate(addDays(today, CALENDAR_DAYS - 1));

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [generating, setGenerating] = useState(false);

  const householdId = user?.householdId as Id<"households"> | undefined;

  const recentLists = useQuery(
    api.functions.shoppingLists.listForHousehold,
    householdId ? { householdId } : "skip"
  );

  const generate = useMutation(api.functions.shoppingLists.generate);
  const deleteList = useMutation(api.functions.shoppingLists.deleteList);

  const handleGenerate = async () => {
    if (!householdId || !user) return;
    setGenerating(true);
    try {
      const listId = await generate({
        householdId,
        startDate,
        endDate,
        generatedBy: user._id,
      });
      router.push(`/shopping/${listId}`);
    } finally {
      setGenerating(false);
    }
  };

  if (!user?.householdId) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-xl font-semibold tracking-tight mb-6">Shopping</h1>

      {/* Generator */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 mb-8">
        <h2 className="text-sm font-medium mb-3">Generate Shopping List</h2>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              To
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating || !startDate || !endDate || startDate > endDate}
          className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {generating ? "Generating..." : "Generate List"}
        </button>
      </div>

      {/* History */}
      <div>
        <h2 className="text-sm font-medium mb-3">Recent Lists</h2>
        {recentLists === undefined ? (
          <p className="text-sm text-zinc-500 py-4">Loading...</p>
        ) : recentLists.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4 text-center">
            No shopping lists yet. Generate one from your meal plan above.
          </p>
        ) : (
          <div className="space-y-2">
            {recentLists.map((list) => (
              <div
                key={list._id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <Link
                  href={`/shopping/${list._id}`}
                  className="flex-1 min-w-0"
                >
                  <div className="text-sm font-medium">
                    {formatDateRange(list.dateRangeStart, list.dateRangeEnd)}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {list.checkedCount}/{list.itemCount} items checked
                    <span className="mx-1.5">&middot;</span>
                    {formatRelative(list.generatedAt)}
                  </div>
                </Link>
                <button
                  onClick={() => deleteList({ id: list._id })}
                  className="flex-shrink-0 p-2 text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400"
                  aria-label="Delete list"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
