"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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

  // Sync user to Convex on first load
  useEffect(() => {
    if (isAuthenticated && user === null) {
      getOrCreateUser();
    }
  }, [isAuthenticated, user, getOrCreateUser]);

  // Redirect to onboarding if no household
  useEffect(() => {
    if (user && !user.householdId) {
      router.push("/onboarding");
    }
  }, [user, router]);

  const waitingForUser =
    isAuthenticated &&
    (user === undefined || user === null);

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
        {authLoading || !isAuthenticated ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-zinc-500">
            Loading…
          </div>
        ) : waitingForUser ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-zinc-500">
            Loading…
          </div>
        ) : user && !user.householdId ? null : (
          children
        )}
      </main>
    </div>
  );
}
