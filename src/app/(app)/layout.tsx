"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMutation } from "convex/react";
import { UserButton } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";

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

  // Wait for Convex auth to sync with Clerk, then for user record
  if (authLoading || !isAuthenticated || user === undefined || user === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!user.householdId) {
    return null; // redirecting to onboarding
  }

  const firstName = user.displayName.split(" ")[0];

  return (
    <div className="flex flex-col min-h-screen">
      <nav className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-6">
              <a href="/plan" className="text-lg font-semibold tracking-tight">
                Scran
              </a>
              <div className="hidden sm:flex items-center gap-4 text-sm">
                <a
                  href="/plan"
                  className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Plan
                </a>
                <a
                  href="/recipes"
                  className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Recipes
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-500">{firstName}</span>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}
