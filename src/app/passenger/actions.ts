"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { passengers } from "@/features/passengers";
import { gender } from "@/features/profile";
import { rides, rideRequestForm } from "@/features/rides";
import { requireAuth } from "@/lib/auth-guards";
import { withinRateLimit } from "@/lib/rate-limit";
import { requestPassengerRide } from "@/use-cases/request-passenger-ride";

export type BookRideResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "invalid"
        | "noPassenger"
        | "unknownPassenger"
        | "notAMember"
        | "outOfRange"
        | "duplicate"
        | "tooMany"
        | "generic";
    };

const PASSENGER = "/passenger";

function revalidatePassenger() {
  revalidatePath(PASSENGER);
  revalidatePath(`${PASSENGER}/rides`);
}

export async function bookRide(input: unknown): Promise<BookRideResult> {
  const session = await requireAuth();

  if (
    !withinRateLimit(`ride:${session.user.id}`, {
      max: 5,
      windowMs: 10 * 60_000,
    })
  ) {
    return { ok: false, error: "tooMany" };
  }

  const parsed = rideRequestForm.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    const result = await requestPassengerRide({
      userId: session.user.id,
      form: parsed.data,
    });
    if (!result.ok) return { ok: false, error: result.reason };

    revalidatePassenger();
    return { ok: true };
  } catch (error) {
    console.error("[passenger] ride request failed", error);
    return { ok: false, error: "generic" };
  }
}

export type CancelRideResult = { ok: true } | { ok: false; error: string };

export async function cancelRideRequest(
  id: unknown,
): Promise<CancelRideResult> {
  const session = await requireAuth();

  // Cancelling is cheap to ask for and expensive to serve: every
  // `revalidatePath` drops the cached shell of two routes for everyone, so an
  // unbounded loop here is an invalidation firehose rather than a private cost.
  if (
    !withinRateLimit(`ride-cancel:${session.user.id}`, {
      max: 20,
      windowMs: 10 * 60_000,
    })
  ) {
    return { ok: false, error: "tooMany" };
  }

  const parsed = z.string().min(1).max(64).safeParse(id);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    // `null` is "not yours, or gone" — reported as success on purpose, so the
    // action cannot be used to probe for ride ids. Only a real write
    // revalidates, though: an id that changed nothing must not cost a cache.
    const cancelled = await rides.cancelRide(parsed.data, session.user.id);
    if (cancelled) revalidatePassenger();
    return { ok: true };
  } catch (error) {
    console.error("[passenger] ride cancel failed", error);
    return { ok: false, error: "generic" };
  }
}

export type UpdateRiderResult =
  { ok: true } | { ok: false; error: "invalid" | "notYours" | "generic" };

const riderInput = z.object({
  passengerId: z.string().min(1).max(64),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  birthDate: z.iso.date(),
  gender,
});

/**
 * Correcting a rider's details. Single-feature, so the Action calls the Facade
 * directly — a use case here would only forward.
 *
 * `passengerId` is never trusted: the facade's write is scoped to the account
 * that manages the row, so a foreign id updates nothing and comes back as
 * `notYours` rather than as a silent success.
 */
export async function updateRiderAction(
  input: unknown,
): Promise<UpdateRiderResult> {
  const session = await requireAuth();

  if (
    !withinRateLimit(`rider:${session.user.id}`, {
      max: 20,
      windowMs: 10 * 60_000,
    })
  ) {
    return { ok: false, error: "generic" };
  }

  const parsed = riderInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { passengerId, birthDate, ...names } = parsed.data;

  try {
    const written = await passengers.updateManagedPassenger(
      passengerId,
      session.user.id,
      { ...names, birthDate: new Date(`${birthDate}T00:00:00Z`) },
    );
    if (!written) return { ok: false, error: "notYours" };

    revalidatePassenger();
    revalidatePath(`${PASSENGER}/profile`);
    return { ok: true };
  } catch (error) {
    console.error("[passenger] rider update failed", error);
    return { ok: false, error: "generic" };
  }
}
