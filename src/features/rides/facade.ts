import {
  isOpen,
  OPEN_STATUSES,
  RIDE_HORIZON_DAYS,
  rideRequestInput,
} from "./schemas";
import type { RideRequestInput } from "./schemas";
import {
  findOpenRideRequestOn,
  findRideRequestById,
  findRideRequestsOfChapters,
  findRideRequestsOfPassengers,
  insertRideRequest,
  updateRideRequestStatus,
} from "./services/ride-requests";

export type PassengerRideRequest = Awaited<
  ReturnType<typeof findRideRequestsOfPassengers>
>[number];

export type ChapterRideRequest = Awaited<
  ReturnType<typeof findRideRequestsOfChapters>
>[number];

export class RideRequestError extends Error {
  constructor(readonly reason: "outOfRange" | "duplicate" | "notCancellable") {
    super(reason);
    this.name = "RideRequestError";
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** `YYYY-MM-DD` is a calendar day: parsed in UTC so it is stored as the day
 *  that was picked, not the day that follows it east of Greenwich. */
const toCalendarDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

const startOfUtcDay = (at: Date) =>
  new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));

/**
 * The window a request may name. The lower bound is UTC today rather than the
 * caller's today — every local tomorrow lands on or after it, whatever the zone,
 * so an honest same-day-plus-one pick is never rejected as "in the past".
 */
export function rideDateWindow(now: Date = new Date()) {
  const from = startOfUtcDay(now);
  return { from, to: new Date(from.getTime() + RIDE_HORIZON_DAYS * DAY_MS) };
}

export const listRequestsOfPassengers = (passengerIds: string[]) =>
  passengerIds.length === 0
    ? Promise.resolve([])
    : findRideRequestsOfPassengers(passengerIds);

export const listRequestsOfChapters = (chapterIds: string[]) =>
  chapterIds.length === 0
    ? Promise.resolve([])
    : findRideRequestsOfChapters(chapterIds);

/**
 * Phase 1 of the ride lifecycle: the wish joins the chapter's Ride Request List.
 * Callers must have established that `passengerId` is theirs to book for — the
 * facade stays free of session context so CRON and scripts can reuse it.
 */
export async function requestRide(
  input: RideRequestInput,
  now: Date = new Date(),
) {
  const data = rideRequestInput.parse(input);
  const preferredDate = toCalendarDate(data.preferredDate);

  // Explicit, because the two comparisons below are both false for NaN: an
  // unparseable day would slip through the window rather than be caught by it.
  // `rideDate` already refuses one — this is the belt to that pair of braces.
  const { from, to } = rideDateWindow(now);
  if (
    Number.isNaN(preferredDate.getTime()) ||
    preferredDate < from ||
    preferredDate > to
  ) {
    throw new RideRequestError("outOfRange");
  }

  // One open request per passenger per day. A second one is a double tap or a
  // forgotten first attempt far more often than it is a genuine second ride.
  const clash = await findOpenRideRequestOn(
    data.passengerId,
    preferredDate,
    OPEN_STATUSES,
  );
  if (clash) throw new RideRequestError("duplicate");

  return insertRideRequest({
    chapterId: data.chapterId,
    passengerId: data.passengerId,
    requestedByUserId: data.requestedByUserId,
    preferredDate,
    timeOfDay: data.timeOfDay,
    note: data.note?.length ? data.note : null,
  });
}

/**
 * Withdrawing a request. `byUserId` is matched against the person who filed it,
 * so a stolen id cannot cancel a stranger's ride — the guard in the Action
 * proves who is asking, this proves the row is theirs.
 */
export async function cancelRide(id: string, byUserId: string) {
  const existing = await findRideRequestById(id);
  if (!existing || existing.requestedByUserId !== byUserId) return null;
  if (!isOpen(existing.status)) throw new RideRequestError("notCancellable");

  return updateRideRequestStatus(id, "cancelled", new Date());
}
