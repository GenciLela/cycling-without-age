import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { requirePerspective } from "@/lib/auth-guards";
import { resolveLocale, toIsoDateUtc } from "@/lib/format";
import { getDictionary } from "@/lib/i18n";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { listPassengerRides } from "@/use-cases/list-passenger-rides";
import { RideStatus } from "../_components/ride-status";
import {
  nextRideFirst,
  toRideView,
  type RideView,
} from "../_components/ride-view";
import { CancelRide, type CancelRideStrings } from "./_components/cancel-ride";

export default function PassengerRidesPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pt-5 pb-6">
      <Suspense fallback={<RidesSkeleton />}>
        <Rides />
      </Suspense>
    </main>
  );
}

function RidesSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-40 w-full rounded-(--r-card)" />
      <Skeleton className="h-40 w-full rounded-(--r-card)" />
    </div>
  );
}

async function Rides() {
  const session = await requirePerspective("passenger");
  const [{ people, requests }, dict, head] = await Promise.all([
    listPassengerRides(session.user.id),
    getDictionary(),
    headers(),
  ]);

  if (people.length === 0) redirect("/onboarding");

  const locale = resolveLocale(head.get("accept-language"));
  const today = toIsoDateUtc(new Date());
  const strings = dict.passenger.rides;

  const all = requests.map((request) =>
    toRideView(request, dict, locale, today, session.user.id),
  );
  const upcoming = all.filter((ride) => ride.upcoming).sort(nextRideFirst);
  const past = all.filter((ride) => !ride.upcoming);

  return (
    <>
      <h1 className="text-3xl tracking-tight">{strings.title}</h1>

      {all.length === 0 ? (
        <Empty className="mt-8 rounded-(--r-card) border border-line">
          <EmptyHeader>
            <EmptyMedia
              variant="icon"
              className="bg-mint-tint text-ink"
            >
              <CalendarDays aria-hidden />
            </EmptyMedia>
            <EmptyTitle>{strings.empty}</EmptyTitle>
            <EmptyDescription className="text-ink-soft">
              {strings.emptyBody}
            </EmptyDescription>
          </EmptyHeader>
          <Link
            href="/passenger/book"
            className="mt-2 flex min-h-14 items-center justify-center rounded-(--r-tile) bg-red px-6 font-display text-lg font-bold text-white transition-colors hover:bg-red-hover motion-reduce:transition-none"
          >
            {strings.book}
          </Link>
        </Empty>
      ) : null}

      {upcoming.length > 0 ? (
        <Group
          title={strings.upcoming}
          rides={upcoming}
          showRider={people.length > 1}
          noteLabel={strings.note}
          cancel={strings}
        />
      ) : null}

      {past.length > 0 ? (
        <Group
          title={strings.past}
          rides={past}
          showRider={people.length > 1}
          noteLabel={strings.note}
          cancel={strings}
        />
      ) : null}
    </>
  );
}

function Group({
  title,
  rides,
  showRider,
  noteLabel,
  cancel,
}: {
  title: string;
  rides: RideView[];
  showRider: boolean;
  noteLabel: string;
  cancel: CancelRideStrings;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-2sm font-semibold tracking-wide text-ink-soft uppercase">
        {title}
      </h2>
      <ul className="mt-3 flex flex-col gap-3">
        {rides.map((ride) => (
          <li key={ride.id}>
            <article className="flex flex-col gap-3 rounded-(--r-card) border border-line p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xl font-medium">{ride.day}</p>
                  <p className="text-ink-soft">{ride.when}</p>
                  {showRider ? (
                    <p className="mt-1 text-sm text-ink-soft">
                      {ride.riderName}
                    </p>
                  ) : null}
                </div>
                <RideStatus
                  status={ride.status}
                  label={ride.statusLabel}
                  className="shrink-0"
                />
              </div>

              {ride.note ? (
                <figure className="rounded-(--r-card) bg-mint-tint p-4">
                  <figcaption className="text-2sm font-semibold tracking-wide text-ink-soft uppercase">
                    {noteLabel}
                  </figcaption>
                  <blockquote className="mt-1 text-sm whitespace-pre-wrap">
                    {ride.note}
                  </blockquote>
                </figure>
              ) : null}

              <p className="text-2sm text-ink-soft">{ride.askedOn}</p>

              {ride.cancellable ? (
                <CancelRide
                  id={ride.id}
                  day={ride.day}
                  strings={cancel}
                />
              ) : null}
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
