"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { enUS } from "@clerk/localizations";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Primary CTA copy on `/signin` only (rest of app keeps default `Continue`). */
const signInLocalization = {
  ...enUS,
  formButtonPrimary: "Access Care Dashboard",
};

export function ClerkProviderWithPathLocalization({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isSignIn = pathname?.startsWith("/signin") ?? false;

  return (
    <ClerkProvider
      appearance={{
        elements: {
          footerItem: "hidden",
        },
      }}
      localization={isSignIn ? signInLocalization : enUS}
    >
      {children}
    </ClerkProvider>
  );
}
