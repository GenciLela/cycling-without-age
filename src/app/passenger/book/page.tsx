import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { chapters } from "@/features/chapters";
import { passengers } from "@/features/passengers";
import { RIDE_HORIZON_DAYS } from "@/features/rides";
import { requirePerspective } from "@/lib/auth-guards";
import {
  formatWeekdayDateLong,
  resolveLocale,
  toIsoDateUtc,
  type Locale,
} from "@/lib/format";
import { getDictionary } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import { BookRide, type DayOption } from "./_components/book-ride";

export default function BookRidePage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pt-5 pb-6">
      <Suspense fallback={<BookSkeleton />}>
        <Book />
      </Suspense>
    </main>
  );
}

function BookSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-16 w-full rounded-(--r-card)" />
      <Skeleton className="h-16 w-full rounded-(--r-card)" />
      <Skeleton className="h-16 w-full rounded-(--r-card)" />
    </div>
  );
}

/**
 * The bookable days, written out on the server so the list is identical in both
 * renders and `Intl` never reaches the browser. It starts tomorrow: a chapter
 * needs a day to find a pilot, and offering today would mostly produce requests
 * nobody can honour.
 */
function bookableDays(locale: Locale, tomorrowLabel: string): DayOption[] {
  const now = new Date();
  const start = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const day = 24 * 60 * 60 * 1000;

  return Array.from({ length: RIDE_HORIZON_DAYS - 2 }, (_, index) => {
    const date = new Date(start + (index + 1) * day);
    return {
      iso: toIsoDateUtc(date),
      label: formatWeekdayDateLong(date, locale),
      badge: index === 0 ? tomorrowLabel : null,
    };
  });
}

async function Book() {
  const session = await requirePerspective("passenger");
  const [people, dict, head] = await Promise.all([
    passengers.listPassengersManagedBy(session.user.id),
    getDictionary(),
    headers(),
  ]);

  if (people.length === 0) redirect("/onboarding");

  const locale = resolveLocale(head.get("accept-language"));
  const chapter = await chapters.getChapter(people[0].chapterId);

  return (
    <BookRide
      days={bookableDays(locale, dict.passenger.book.tomorrow)}
      people={people.map((person) => ({
        id: person.id,
        name: `${person.firstName} ${person.lastName}`,
      }))}
      chapterName={chapter?.name ?? ""}
      strings={dict.passenger.book}
      when={dict.passenger.when}
    />
  );
}
