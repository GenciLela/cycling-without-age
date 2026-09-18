"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { rides, RideRequestError, rideDecision } from "@/features/rides";
import { requireAuth, requireChapterAdmin } from "@/lib/auth-guards";

export type RideDecisionResult =
  { ok: true } | { ok: false; error: "alreadyDecided" | "generic" };

const id = z.string().min(1).max(64);

const decideInput = z.object({
  id,
  decision: rideDecision,
  declineReason: z.string().trim().max(500).optional(),
});

const completeInput = z.object({ id });

function revalidate() {
  revalidatePath("/admin/rides");
  // The passenger's own screens are session-dynamic, so this is housekeeping
  // rather than the mechanism: what actually shows them the answer is their
  // next request. Kept so a cached shell can never outlive the decision.
  revalidatePath("/passenger", "layout");
}

function failed(error: unknown): RideDecisionResult {
  if (
    error instanceof RideRequestError &&
    (error.reason === "alreadyDecided" || error.reason === "notCompletable")
  ) {
    return { ok: false, error: "alreadyDecided" };
  }
  console.error("[admin] ride decision failed", error);
  return { ok: false, error: "generic" };
}

export async function decideRideAction(
  input: z.input<typeof decideInput>,
): Promise<RideDecisionResult> {
  const parsed = decideInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "generic" };

  // The chapter to guard against is the request's own, so it has to be read
  // first — behind a session, so an anonymous POST cannot probe for ids.
  await requireAuth();
  const request = await rides.getRequest(parsed.data.id);
  if (!request) return { ok: false, error: "generic" };
  const session = await requireChapterAdmin(request.chapterId);

  try {
    await rides.decideRide(
      parsed.data.id,
      {
        decision: parsed.data.decision,
        declineReason: parsed.data.declineReason,
      },
      session.user.id,
    );
    revalidate();
    return { ok: true };
  } catch (error) {
    return failed(error);
  }
}

export async function completeRideAction(
  input: z.input<typeof completeInput>,
): Promise<RideDecisionResult> {
  const parsed = completeInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "generic" };

  await requireAuth();
  const request = await rides.getRequest(parsed.data.id);
  if (!request) return { ok: false, error: "generic" };
  await requireChapterAdmin(request.chapterId);

  try {
    await rides.completeRide(parsed.data.id);
    revalidate();
    return { ok: true };
  } catch (error) {
    return failed(error);
  }
}
