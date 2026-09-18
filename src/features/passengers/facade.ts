import { passengerDetails, passengerInput } from "./schemas";
import type { PassengerDetailsInput, PassengerInput } from "./schemas";
import {
  countPassengersManagedBy,
  findPassengerOfUser,
  findPassengersManagedBy,
  findPassengersOfChapters,
  insertPassenger,
  updatePassengerManagedBy,
  upsertOwnPassenger,
} from "./services/passengers";

export const getOwnPassenger = (userId: string) => findPassengerOfUser(userId);
export const listPassengersManagedBy = (userId: string) =>
  findPassengersManagedBy(userId);
export const listPassengersOfChapters = (chapterIds: string[]) =>
  findPassengersOfChapters(chapterIds);

export type PassengerRow = Awaited<
  ReturnType<typeof findPassengersOfChapters>
>[number];

export async function addPassenger(input: PassengerInput) {
  const data = passengerInput.parse(input);
  const [existing] = await findPassengersManagedBy(data.managedByUserId);
  if (existing && existing.chapterId !== data.chapterId) {
    throw new Error("Passengers of one account must share a chapter");
  }
  if (data.userId && (await findPassengerOfUser(data.userId))) {
    throw new Error("Already has a passenger profile");
  }
  return insertPassenger({ ...data, userId: data.userId ?? null });
}

export const countPassengers = (userId: string) =>
  countPassengersManagedBy(userId);

export async function saveOwnPassenger(input: PassengerInput) {
  const data = passengerInput.parse(input);
  if (!data.userId)
    throw new Error("saveOwnPassenger needs the account's own id");

  const existing = await findPassengerOfUser(data.userId);
  if (!existing) return addPassenger(data);

  // `chapterId` from the input is dropped on purpose: the existing row's chapter
  // wins, because moving someone between chapters is leaving one, not editing a name.
  const { userId, firstName, lastName, birthDate, gender } = data;
  return upsertOwnPassenger(userId, {
    firstName,
    lastName,
    birthDate,
    gender,
    chapterId: existing.chapterId,
    managedByUserId: existing.managedByUserId,
  });
}

/**
 * Correcting a rider's details. `false` means the row is not this account's —
 * the scope lives in the query, so the caller cannot get it wrong and the
 * facade stays free of session context.
 */
export async function updateManagedPassenger(
  id: string,
  managedByUserId: string,
  input: PassengerDetailsInput,
) {
  const data = passengerDetails.parse(input);
  return (await updatePassengerManagedBy(id, managedByUserId, data)) === 1;
}
