import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePerspective } from "@/lib/auth-guards";
import { resolveLocale, toIsoDateUtc } from "@/lib/format";
import { getDictionary } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import { listPassengerRides } from "@/use-cases/list-passenger-rides";
import { RideStatus } from "../../_components/ride-status";
import { toRideView } from "../../_components/ride-view";
import { CancelRide } from "../_components/cancel-ride";

export default function PassengerRidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pt-5 pb-6">
      <Suspense fallback={<RideSkeleton />}>
        <Ride params={params} />
      </Suspense>
    </main>
  );
}

function RideSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-12 w-32" />
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-40 w-full rounded-(--r-card)" />
    </div>
  );
}

/**
 * The authorised set is `listPassengerRides`, the same query the booking
 * authorisation rests on — a ride that is not in it is `notFound`, never a
 * "forbidden" that would confirm the id exists.
 */
async function Ride({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePerspective("passenger");
  const [{ id }, { people, requests }, dict, head] = await Promise.all([
    params,
    listPassengerRides(session.user.id),
    getDictionary(),
    headers(),
  ]);

  if (people.length === 0) redirect("/onboarding");

  const request = requests.find((candidate) => candidate.id === id);
  if (!request) notFound();

  const locale = resolveLocale(head.get("accept-language"));
  const today = toIsoDateUtc(new Date());
  const ride = toRideView(request, dict, locale, today, session.user.id);
  const strings = dict.passenger.detail;
  const body = {
    requested: strings.requestedBody,
    confirmed: strings.confirmedBody,
    declined: strings.declinedBody,
    cancelled: strings.cancelledBody,
    completed: strings.completedBody,
  }[ride.status];

  return (
    <>
      <Link
        href="/passenger/rides"
        className="-ml-2 flex min-h-12 w-fit items-center gap-2 rounded-full px-3 text-base text-ink-soft transition-colors hover:bg-grey-tint hover:text-ink motion-reduce:transition-none"
      >
        <ArrowLeft
          aria-hidden
          className="size-5"
        />
        {strings.back}
      </Link>

      <header className="mt-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl tracking-tight">{ride.day}</h1>
          <p className="mt-1 text-ink-soft">{ride.when}</p>
        </div>
        <RideStatus
          status={ride.status}
          label={ride.statusLabel}
          className="mt-1 shrink-0"
        />
      </header>

      <p className="mt-5">{body}</p>

      {ride.declineReason ? (
        <figure className="mt-5 rounded-(--r-card) bg-mint-tint p-5">
          <figcaption className="text-2sm font-semibold tracking-wide text-ink-soft uppercase">
            {strings.reason}
          </figcaption>
          <blockquote className="mt-1 whitespace-pre-wrap">
            {ride.declineReason}
          </blockquote>
        </figure>
      ) : null}

      <dl className="mt-6 divide-y divide-line rounded-(--r-card) border border-line">
        <Row
          label={strings.rider}
          value={ride.riderName}
        />
        <Row
          label={strings.chapter}
          value={ride.chapterName}
        />
      </dl>

      {ride.note ? (
        <figure className="mt-5 rounded-(--r-card) border border-line p-5">
          <figcaption className="text-2sm font-semibold tracking-wide text-ink-soft uppercase">
            {strings.note}
          </figcaption>
          <blockquote className="mt-1 whitespace-pre-wrap">
            {ride.note}
          </blockquote>
        </figure>
      ) : null}

      <p className="mt-5 text-2sm text-ink-soft">
        {[ride.askedOn, ride.decidedOn, ride.cancelledOn]
          .filter(Boolean)
          .join(" · ")}
      </p>

      {ride.cancellable ? (
        <div className="mt-6">
          <CancelRide
            id={ride.id}
            day={ride.day}
            strings={dict.passenger.rides}
          />
        </div>
      ) : (
        <Link
          href="/passenger/book"
          className="mt-6 flex min-h-14 items-center justify-center rounded-(--r-tile) bg-red px-6 font-display text-lg font-bold text-white transition-colors hover:bg-red-hover motion-reduce:transition-none"
        >
          {strings.book}
        </Link>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3">
      <dt className="text-2sm text-ink-soft">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
