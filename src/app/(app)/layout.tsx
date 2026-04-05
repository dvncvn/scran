"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { ThemeToggle } from "../../../components/features/ThemeToggle";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const getOrCreateUser = useMutation(api.functions.users.getOrCreateUser);
  const user = useQuery(api.functions.users.currentUser);
  const household = useQuery(
    api.functions.households.get,
    user?.householdId ? { id: user.householdId } : "skip"
  );
  const router = useRouter();
  const pathname = usePathname();
  const syncingRef = useRef(false);

  // Sync user to Convex on first authenticated load where no user doc exists.
  // user === undefined means query is still loading — don't act on that.
  // user === null means query ran and found no user — create one.
  useEffect(() => {
    if (!isAuthenticated || user === undefined || user !== null || syncingRef.current) return;
    syncingRef.current = true;

    let cancelled = false;
    const attempt = (retries: number) => {
      getOrCreateUser()
        .catch(() => {
          if (!cancelled && retries > 0) {
            setTimeout(() => attempt(retries - 1), 500);
          }
        })
        .finally(() => {
          if (!cancelled) syncingRef.current = false;
        });
    };
    attempt(5);

    return () => { cancelled = true; };
  }, [isAuthenticated, user, getOrCreateUser]);

  // Redirect to onboarding if user exists but has no household
  useEffect(() => {
    if (user && !user.householdId) {
      router.push("/onboarding");
    }
  }, [user, router]);

  // Only block rendering while the query is still loading (undefined),
  // NOT when it returned null (we handle that with the sync effect above).
  const waitingForAuth = authLoading || !isAuthenticated;
  const waitingForUser = isAuthenticated && user === undefined;

  return (
    <div className="flex flex-col min-h-screen">
      <nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                href="/plan"
                className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
              >
                Scran
              </Link>
              {household?.name ? (
                <span className="text-sm text-zinc-400 dark:text-zinc-500">
                  {household.name}
                </span>
              ) : household === null ? null : (
                <span className="inline-block h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              )}
              <div className="hidden sm:flex items-center gap-4 text-sm">
                <Link
                  href="/plan"
                  className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Plan
                </Link>
                <Link
                  href="/recipes"
                  className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Recipes
                </Link>
                <Link
                  href="/shopping"
                  className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Shopping
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 min-h-8">
              <ThemeToggle />
              {isAuthenticated && !authLoading ? (
                <UserButton />
              ) : (
                <span className="inline-block h-8 w-8 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 min-w-0 overflow-x-hidden pb-16 sm:pb-0">
        {waitingForAuth || waitingForUser ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-zinc-500">
            Loading…
          </div>
        ) : user === null ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-zinc-500">
            Setting up your account…
          </div>
        ) : !user?.householdId ? null : (
          children
        )}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 sm:hidden">
        <div className="flex items-center justify-around h-14">
          <Link
            href="/plan"
            className={`flex flex-col items-center gap-0.5 px-4 py-2 text-xs ${
              pathname.startsWith("/plan")
                ? "text-zinc-900 dark:text-zinc-100 font-medium"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M5.25 12a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H6a.75.75 0 0 1-.75-.75V12ZM6 13.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V14a.75.75 0 0 0-.75-.75H6ZM7.25 12a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H8a.75.75 0 0 1-.75-.75V12ZM8 13.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V14a.75.75 0 0 0-.75-.75H8ZM9.25 10a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H10a.75.75 0 0 1-.75-.75V10ZM10 11.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V12a.75.75 0 0 0-.75-.75H10ZM9.25 14a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H10a.75.75 0 0 1-.75-.75V14ZM12 9.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V10a.75.75 0 0 0-.75-.75H12ZM11.25 12a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H12a.75.75 0 0 1-.75-.75V12ZM12 13.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V14a.75.75 0 0 0-.75-.75H12ZM13.25 10a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H14a.75.75 0 0 1-.75-.75V10ZM14 11.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V12a.75.75 0 0 0-.75-.75H14Z" />
              <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
            </svg>
            Plan
          </Link>
          <Link
            href="/recipes"
            className={`flex flex-col items-center gap-0.5 px-4 py-2 text-xs ${
              pathname.startsWith("/recipes")
                ? "text-zinc-900 dark:text-zinc-100 font-medium"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M10.75 16.82A7.462 7.462 0 0 1 15 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0 0 18 15.06v-11a.75.75 0 0 0-.546-.721A9.006 9.006 0 0 0 15 3a8.963 8.963 0 0 0-4.25 1.065V16.82ZM9.25 4.065A8.963 8.963 0 0 0 5 3c-.85 0-1.673.118-2.454.339A.75.75 0 0 0 2 4.06v11a.75.75 0 0 0 .954.721A7.506 7.506 0 0 1 5 15.5c1.579 0 3.042.487 4.25 1.32V4.065Z" />
            </svg>
            Recipes
          </Link>
          <Link
            href="/shopping"
            className={`flex flex-col items-center gap-0.5 px-4 py-2 text-xs ${
              pathname.startsWith("/shopping")
                ? "text-zinc-900 dark:text-zinc-100 font-medium"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M6 5v1H4.667a1.75 1.75 0 0 0-1.743 1.598l-.826 9.5A1.75 1.75 0 0 0 3.84 19H16.16a1.75 1.75 0 0 0 1.743-1.902l-.826-9.5A1.75 1.75 0 0 0 15.333 6H14V5a4 4 0 0 0-8 0Zm4-2.5A2.5 2.5 0 0 0 7.5 5v1h5V5A2.5 2.5 0 0 0 10 2.5ZM7.5 10a2.5 2.5 0 0 0 5 0V8.75a.75.75 0 0 1 1.5 0V10a4 4 0 0 1-8 0V8.75a.75.75 0 0 1 1.5 0V10Z" clipRule="evenodd" />
            </svg>
            Shopping
          </Link>
        </div>
      </nav>
    </div>
  );
}
