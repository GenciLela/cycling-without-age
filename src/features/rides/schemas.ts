import { z } from "zod";

export const rideTimeOfDay = z.enum(["morning", "afternoon", "any"]);
export type RideTimeOfDay = z.infer<typeof rideTimeOfDay>;

export const rideRequestStatus = z.enum([
  "requested",
  "confirmed",
  "declined",
  "cancelled",
  "completed",
]);
export type RideRequestStatus = z.infer<typeof rideRequestStatus>;

/**
 * How far ahead a ride may be asked for. Wide enough for "the week after next",
 * narrow enough that nothing sits on a scheduler's list for a whole season.
 */
export const RIDE_HORIZON_DAYS = 30;

/**
 * Calendar day, no time, no zone — the column is `@db.Date`.
 *
 * `z.iso.date()` rather than a shape regex, because a regex would pass
 * `2026-13-01` (which `new Date` turns into an Invalid Date, and every `<`/`>`
 * against NaN is false — so the horizon check below would wave it through) and
 * `2026-02-31` (which V8 silently rolls over to 3 March).
 */
export const rideDate = z.iso.date();

/** What the booking form sends. The passenger is chosen only when someone
 *  manages more than one; otherwise the use case resolves the single one. */
export const rideRequestForm = z.object({
  passengerId: z.string().min(1).max(64).optional(),
  preferredDate: rideDate,
  timeOfDay: rideTimeOfDay,
  note: z.string().trim().max(500).optional(),
});
export type RideRequestForm = z.infer<typeof rideRequestForm>;

/** What reaches the facade: already resolved and already authorised. */
export const rideRequestInput = z.object({
  chapterId: z.string().min(1).max(64),
  passengerId: z.string().min(1).max(64),
  requestedByUserId: z.string().min(1).max(64),
  preferredDate: rideDate,
  timeOfDay: rideTimeOfDay,
  note: z.string().trim().max(500).nullish(),
});
export type RideRequestInput = z.infer<typeof rideRequestInput>;

/** A status a passenger can still walk away from. */
export const OPEN_STATUSES = ["requested", "confirmed"] as const;

export const isOpen = (status: RideRequestStatus) =>
  (OPEN_STATUSES as readonly string[]).includes(status);

/** The two answers a chapter gives a request. Cancelling is the passenger's own
 *  verb and keeps its own path. */
export const rideDecision = z.enum(["confirmed", "declined"]);
export type RideDecision = z.infer<typeof rideDecision>;

export const rideDecisionInput = z.object({
  decision: rideDecision,
  declineReason: z.string().trim().max(500).optional(),
});
export type RideDecisionInput = z.infer<typeof rideDecisionInput>;
