import { Suspense, type ReactNode } from "react";
import { getDictionary } from "@/lib/i18n";
import { PassengerNav } from "./_components/passenger-nav";

/**
 * The passenger shell. Two decisions live here and nowhere else:
 *
 *  - `text-lg` is the base size for this whole perspective — 18px rather than
 *    the app's 16 — because the people reading it are the reason the movement
 *    exists. Anything that steps down from it does so deliberately.
 *  - The nav is fixed to the bottom edge, so the content reserves its height
 *    plus the home-indicator inset instead of sliding under it.
 *
 * Not a security boundary: every page below re-guards for itself. `/passenger`
 * stays open to guests on purpose, so the shell guards nothing at all.
 */
export default function PassengerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-1 flex-col bg-canvas text-lg">
      <div className="flex flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <Suspense fallback={null}>
        <Nav />
      </Suspense>
    </div>
  );
}

async function Nav() {
  const dict = await getDictionary();
  return <PassengerNav strings={dict.passenger.nav} />;
}
