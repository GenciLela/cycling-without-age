import { membership } from "@/features/membership";
import { passengers } from "@/features/passengers";
import { rides, RideRequestError } from "@/features/rides";
import type { RideRequestForm } from "@/features/rides";

export type RideRequestFailure =
  | "noPassenger"
  | "unknownPassenger"
  | "notAMember"
  | "outOfRange"
  | "duplicate";

export type RideRequestResult =
  { ok: true; id: string } | { ok: false; reason: RideRequestFailure };

/**
 * Books a ride for someone the caller is actually allowed to book for.
 *
 * Two checks, and both are load-bearing:
 *
 *  1. **Whose rider is this.** `listPassengersManagedBy` only ever returns rows
 *     whose `managedByUserId` is this account, so a `passengerId` posted from
 *     outside simply is not in the list, and the chapter is read off the row
 *     that survived rather than off the request.
 *  2. **Are they still in the chapter.** A `Passenger` row has no relation to
 *     `Member` and nothing cascades between them, so removing someone from a
 *     chapter leaves their rider row behind. Without this check a person a
 *     chapter has just removed could keep filing requests into that chapter's
 *     list — and the page guard would not stop them, because
 *     `redirectIfElsewhere` lets an account with no perspective at all through.
 *
 * Nothing downstream repeats either one.
 */
export async function requestPassengerRide({
  userId,
  form,
}: {
  userId: string;
  form: RideRequestForm;
}): Promise<RideRequestResult> {
  const people = await passengers.listPassengersManagedBy(userId);
  if (people.length === 0) return { ok: false, reason: "noPassenger" };

  const person = form.passengerId
    ? people.find((candidate) => candidate.id === form.passengerId)
    : people.length === 1
      ? people[0]
      : undefined;
  if (!person) return { ok: false, reason: "unknownPassenger" };

  const roles = await membership.getMemberRoles(userId, person.chapterId);
  if (!roles.includes("passenger")) return { ok: false, reason: "notAMember" };

  try {
    const created = await rides.requestRide({
      chapterId: person.chapterId,
      passengerId: person.id,
      requestedByUserId: userId,
      preferredDate: form.preferredDate,
      timeOfDay: form.timeOfDay,
      note: form.note,
    });
    return { ok: true, id: created.id };
  } catch (error) {
    if (
      error instanceof RideRequestError &&
      error.reason !== "notCancellable"
    ) {
      return { ok: false, reason: error.reason };
    }
    throw error;
  }
}
