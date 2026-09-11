"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, House, MessageCircle, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export type PassengerNavStrings = {
  label: string;
  home: string;
  rides: string;
  messages: string;
  profile: string;
};

const TABS = [
  { key: "home", href: "/passenger", icon: House },
  { key: "rides", href: "/passenger/rides", icon: CalendarDays },
  { key: "messages", href: "/passenger/messages", icon: MessageCircle },
  { key: "profile", href: "/passenger/profile", icon: UserRound },
] as const;

/**
 * Four destinations, always labelled. An icon alone is a guessing game for the
 * people this screen is for, and there is room for the word.
 *
 * Red is deliberately absent: the home screen's one red button is what the eye
 * should find first, and a red tab here would compete with it.
 */
export function PassengerNav({ strings }: { strings: PassengerNavStrings }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={strings.label}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex w-full max-w-lg items-stretch">
        {TABS.map(({ key, href, icon: Icon }) => {
          const active =
            href === "/passenger"
              ? pathname === href
              : pathname.startsWith(href);

          return (
            <li
              key={key}
              className="flex-1"
            >
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 transition-colors motion-reduce:transition-none",
                  active ? "text-ink" : "text-ink-soft hover:text-ink",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors motion-reduce:transition-none",
                    active && "bg-mint-tint",
                  )}
                >
                  <Icon
                    aria-hidden
                    className="size-5"
                  />
                </span>
                <span
                  className={cn(
                    "text-2sm",
                    active ? "font-semibold" : "font-medium",
                  )}
                >
                  {strings[key]}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
