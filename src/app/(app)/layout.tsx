"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
      <nav className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                href="/plan"
                className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
              >
                Scran
              </Link>
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
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 min-h-8">
              <ThemeToggle />
              {isAuthenticated && !authLoading ? <UserButton /> : null}
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1">
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
    </div>
  );
}
