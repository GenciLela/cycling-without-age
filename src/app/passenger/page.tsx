import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { chapters } from "@/features/chapters";
import { avatarSeed, avatarSvg } from "@/lib/avatar";
import { getSession, redirectIfElsewhere } from "@/lib/auth-guards";
import { resolveLocale, toIsoDateUtc } from "@/lib/format";
import { getDictionary } from "@/lib/i18n";
import { fill } from "@/lib/utils";
import { listPassengerRides } from "@/use-cases/list-passenger-rides";
import { PersonAvatar } from "@/components/person-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { RideStatus } from "./_components/ride-status";
import {
  nextRideFirst,
  toRideView,
  type RideView,
} from "./_components/ride-view";

export default function PassengerHomePage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pt-5 pb-6">
      <Suspense fallback={<HomeSkeleton />}>
        <Home />
      </Suspense>
    </main>
  );
}

function HomeSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <Skeleton className="size-12 rounded-full" />
      <Skeleton className="mt-5 h-9 w-56" />
      <div className="flex flex-1 items-center py-12">
        <Skeleton className="h-26 w-full rounded-(--r-tile)" />
      </div>
    </div>
  );
}

async function Home() {
  const session = await getSession();
  const [dict, head] = await Promise.all([getDictionary(), headers()]);
  const locale = resolveLocale(head.get("accept-language"));
  const { home } = dict.passenger;

  // A guest keeps browsing — the chapter page sends people here before they
  // have an account, and turning that into a sign-in wall loses them.
  if (!session) {
    return (
      <Guest
        title={home.greetingGuest}
        body={home.guestBody}
        signIn={home.signIn}
        book={home.book}
        hint={home.bookHint}
      />
    );
  }

  redirectIfElsewhere(session, "passenger");

  const { people, requests } = await listPassengerRides(session.user.id);
  // No rider on the account means onboarding never finished. The flow knows
  // which step is missing; this screen would only be able to guess.
  if (people.length === 0) redirect("/onboarding");

  const own = people.find((person) => person.userId === session.user.id);
  const name = own?.firstName ?? session.user.name.split(" ")[0];
  const chapter = await chapters.getChapter(people[0].chapterId);

  const today = toIsoDateUtc(new Date());
  const next = requests
    .map((request) => toRideView(request, dict, locale, today, session.user.id))
    .filter((ride) => ride.upcoming && ride.status !== "cancelled")
    .sort(nextRideFirst)[0];

  return (
    <>
      <header className="flex items-center justify-between">
        <Link
          href="/passenger/profile"
          aria-label={home.profileAria}
          className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <PersonAvatar
            svg={avatarSvg(avatarSeed(session.user.email), true)}
            className="size-12"
          />
        </Link>
      </header>

      <h1 className="mt-5 text-3xl tracking-tight">
        {fill(home.greeting, { name })}
      </h1>

      {next ? (
        <NextRide
          ride={next}
          label={home.nextRide}
        />
      ) : null}

      <div className="flex flex-1 items-center py-10">
        <BookCta
          label={home.book}
          hint={home.bookHint}
          aria={
            chapter ? fill(home.bookAria, { chapter: chapter.name }) : home.book
          }
        />
      </div>

      {chapter ? (
        <p className="flex items-center justify-center gap-2 text-2sm text-ink-soft">
          <MapPin
            aria-hidden
            className="size-4 shrink-0"
          />
          {fill(home.withChapter, { chapter: chapter.name })}
        </p>
      ) : null}
    </>
  );
}

/**
 * The one red thing on the screen, and the only reason most people open the app.
 * Sized so it is reachable with a thumb and readable without glasses.
 */
function BookCta({
  label,
  hint,
  aria,
}: {
  label: string;
  hint: string;
  aria: string;
}) {
  return (
    <Link
      href="/passenger/book"
      aria-label={aria}
      className="flex min-h-26 w-full flex-col items-center justify-center gap-1 rounded-(--r-tile) bg-red px-5 py-4 text-center text-white shadow-soft transition-colors hover:bg-red-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ink motion-reduce:transition-none"
    >
      <span className="font-display text-3xl font-bold text-balance">
        {label}
      </span>
      <span className="text-sm">{hint}</span>
    </Link>
  );
}

function NextRide({ ride, label }: { ride: RideView; label: string }) {
  return (
    <Link
      href="/passenger/rides"
      className="mt-6 flex items-center gap-4 rounded-(--r-card) bg-mint-tint p-4 transition-colors hover:bg-mint motion-reduce:transition-none"
    >
      <CalendarDays
        aria-hidden
        className="size-6 shrink-0 text-ink"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-2sm text-ink-soft">{label}</span>
        <span className="block font-medium">{ride.day}</span>
        <span className="block text-sm text-ink-soft">{ride.when}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-2">
        <RideStatus
          status={ride.status}
          label={ride.statusLabel}
        />
        <ArrowRight
          aria-hidden
          className="size-4 text-ink-soft"
        />
      </span>
    </Link>
  );
}

function Guest({
  title,
  body,
  signIn,
  book,
  hint,
}: {
  title: string;
  body: string;
  signIn: string;
  book: string;
  hint: string;
}) {
  return (
    <>
      <header className="flex items-center justify-end">
        <Link
          href="/sign-in"
          className="min-h-12 rounded-full border border-line px-5 py-2.5 text-base font-medium transition-colors hover:bg-grey-tint motion-reduce:transition-none"
        >
          {signIn}
        </Link>
      </header>

      <h1 className="mt-5 text-3xl tracking-tight">{title}</h1>
      <p className="mt-3 text-ink-soft">{body}</p>

      <div className="flex flex-1 items-center py-10">
        <BookCta
          label={book}
          hint={hint}
          aria={book}
        />
      </div>
    </>
  );
}
