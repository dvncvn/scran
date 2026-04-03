"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";

export default function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  return <OnboardingForm />;
}

function OnboardingForm() {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createHousehold = useMutation(api.functions.households.create);
  const getOrCreateUser = useMutation(api.functions.users.getOrCreateUser);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const userId = await getOrCreateUser();
      await createHousehold({ name: name.trim(), createdBy: userId });
      router.push("/plan");
    } catch (error) {
      console.error("Failed to create household:", error);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Welcome to Scran
        </h1>
        <p className="text-zinc-500 mb-8">
          Create your household to get started with meal planning.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="household-name"
              className="block text-sm font-medium mb-1"
            >
              Household name
            </label>
            <input
              id="household-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., The Duncans"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isSubmitting ? "Creating..." : "Create household"}
          </button>
        </form>
      </div>
    </div>
  );
}
