"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { DevAgentation } from "./DevAgentation";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/sign-in"
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
        {process.env.NODE_ENV === "development" && <DevAgentation />}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
