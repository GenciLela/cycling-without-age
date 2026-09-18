import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { chapters } from "@/features/chapters";
import { passengers } from "@/features/passengers";
import { requirePerspective } from "@/lib/auth-guards";
import { resolveLocale } from "@/lib/format";
import { getDictionary } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import { BookRide } from "./_components/book-ride";
import { bookableDays } from "./bookable-days";

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
