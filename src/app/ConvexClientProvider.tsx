"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useEffect, useState } from "react";
import { DevAgentation } from "./DevAgentation";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

const clerkAppearance = {
  baseTheme: undefined as typeof dark | undefined,
  variables: {
    colorPrimary: "#18181b",
    colorText: "#18181b",
    colorTextSecondary: "#71717a",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#18181b",
    fontFamily: "var(--font-geist-sans)",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
  },
  elements: {
    card: "shadow-none",
    formButtonPrimary:
      "bg-zinc-900 hover:bg-zinc-800 text-sm font-medium normal-case",
    footerActionLink: "text-zinc-600 hover:text-zinc-900",
    headerTitle: "text-lg font-semibold tracking-tight",
    headerSubtitle: "text-zinc-500 text-sm",
    socialButtonsBlockButton:
      "border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-sm",
    formFieldLabel: "text-sm font-medium text-zinc-700",
    formFieldInput:
      "border-zinc-200 focus:ring-2 focus:ring-zinc-900 text-sm",
    userButtonPopoverCard: "shadow-lg border border-zinc-200",
    userButtonPopoverActionButton: "text-sm text-zinc-700 hover:bg-zinc-50",
    userButtonPopoverActionButtonText: "text-sm",
    userButtonPopoverFooter: "hidden",
  },
};

const clerkDarkAppearance = {
  baseTheme: dark,
  variables: {
    ...clerkAppearance.variables,
    colorPrimary: "#f4f4f5",
    colorText: "#f4f4f5",
    colorTextSecondary: "#d4d4d8",
    colorBackground: "#18181b",
    colorInputBackground: "#27272a",
    colorInputText: "#f4f4f5",
    colorNeutral: "#f4f4f5",
  },
  elements: {
    formButtonPrimary:
      "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 text-sm font-medium normal-case",
    footerActionLink: "text-zinc-400 hover:text-zinc-100",
    headerTitle: "text-lg font-semibold tracking-tight text-zinc-100",
    headerSubtitle: "text-zinc-400 text-sm",
    socialButtonsBlockButton:
      "border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm",
    formFieldLabel: "text-sm font-medium text-zinc-300",
    formFieldInput:
      "border-zinc-700 bg-zinc-800 focus:ring-2 focus:ring-zinc-100 text-sm text-zinc-100",
    card: "shadow-lg border border-zinc-700 bg-zinc-900",
    userButtonPopoverMain: "text-zinc-100",
    userPreviewMainIdentifier: "text-zinc-100",
    userPreviewSecondaryIdentifier: "!text-zinc-300",
    userButtonPopoverFooter: "hidden",
  },
};

function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    setIsDark(el.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(el.classList.contains("dark"));
    });
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const isDark = useIsDark();
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/plan"
      afterSignUpUrl="/onboarding"
      afterSignOutUrl="/sign-in"
      appearance={isDark ? clerkDarkAppearance : clerkAppearance}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
        {process.env.NODE_ENV === "development" && <DevAgentation />}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
