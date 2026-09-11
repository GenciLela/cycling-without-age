import type { PassengerRideRequest } from "@/features/rides";
import { isOpen } from "@/features/rides";
import {
  formatDate,
  formatWeekdayDateLong,
  toIsoDateUtc,
  type Locale,
} from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import { fill } from "@/lib/utils";

/**
 * A ride request with every string already written, so the client components
 * below it never touch `Intl`, the dictionary or a `Date`. Formatting on the
 * server is also what keeps the server and the browser rendering the same day —
 * see the frontend skill on hydration.
 */
export type RideView = {
  id: string;
  riderName: string;
  dayIso: string;
  day: string;
  when: string;
  status: PassengerRideRequest["status"];
  statusLabel: string;
  chapterName: string;
  note: string | null;
  askedOn: string;
  upcoming: boolean;
  cancellable: boolean;
};

/**
 * `viewerUserId` decides `cancellable`, because `rides.cancelRide` matches the
 * row's `requestedByUserId` and refuses everything else. Deriving the button
 * from "upcoming and open" alone would offer a control that silently does
 * nothing the moment a rider can be managed by more than one account.
 */
export function toRideView(
  request: PassengerRideRequest,
  dict: Dictionary,
  locale: Locale,
  today: string,
  viewerUserId: string,
): RideView {
  const dayIso = toIsoDateUtc(request.preferredDate);
  const upcoming = dayIso >= today;

  return {
    id: request.id,
    riderName: `${request.passenger.firstName} ${request.passenger.lastName}`,
    dayIso,
    day: formatWeekdayDateLong(request.preferredDate, locale),
    when: dict.passenger.when[request.timeOfDay],
    status: request.status,
    statusLabel: dict.passenger.status[request.status],
    chapterName: request.chapter.name,
    note: request.note,
    askedOn: fill(dict.passenger.rides.askedOn, {
      date: formatDate(request.createdAt, locale),
    }),
    upcoming,
    cancellable:
      upcoming &&
      isOpen(request.status) &&
      request.requestedByUserId === viewerUserId,
  };
}

/** Soonest first — what "your next ride" means. */
export const nextRideFirst = (a: RideView, b: RideView) =>
  a.dayIso.localeCompare(b.dayIso);
