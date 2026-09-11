import { passengers } from "@/features/passengers";
import { rides } from "@/features/rides";

/**
 * Everyone an account may book for, and every ride they have asked for.
 *
 * `listPassengersManagedBy` is the whole set by construction: a passenger who
 * signed up alone owns their own row (`managedByUserId === userId`), and a
 * relative's rows point at the relative. One query answers both cases, and it is
 * the same query the authorisation in `request-passenger-ride` rests on.
 */
export async function listPassengerRides(userId: string) {
  const people = await passengers.listPassengersManagedBy(userId);
  const requests = await rides.listRequestsOfPassengers(
    people.map((person) => person.id),
  );
  return { people, requests };
}
