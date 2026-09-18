# COD-176 Passenger View — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the passenger perspective's open loop — a chapter can answer a ride request, the passenger sees that answer on a ride of its own, can correct the details the chapter plans from, and every path is tested and guarded.

**Architecture:** Strict vertical slices per `AGENTS.md`. The `rides` slice grows two domain transitions (`decideRide`, `completeRide`) that stay free of session context; a new admin Action guards them with `requireChapterAdmin(chapterId)` read off the request itself; the passenger surfaces read through the existing `list-passenger-rides` use case, so no second authorisation path is created. Rider editing is single-feature and therefore collapses into the Action — no Use Case.

**Tech Stack:** Next.js (App Router, `cacheComponents`), React 19, Prisma + MySQL, Zod v4, Tailwind v4 with brand tokens, shadcn (`new-york`), jest + SWC, Capacitor wrappers under `src/lib/native`.

**Spec:** Linear COD-176 (“Dashboard structure with navigation bar”) plus the gap analysis in this repo's conversation of 2026-09-18. Domain authority: `.claude/skills/cwa-context/references/05-ride-lifecycle.md` §1 (Ride Request) and §2 B.b (“the request is rejected and the requester notified”).

## Global Constraints

- **Layers**: Presentation → Action → (Use Case only if ≥2 facades) → Facade → Service. No DB call outside a Service. No auth inside a Facade.
- **Guards** come from `@/lib/auth-guards`. The narrowest that fits. A layout is not a security boundary.
- **Brand**: ink / white / mint `#92D2C6` / red `#ED1C24` + `--mint-deep`, tokens only, never a hex in a component. Red is the one hero action per screen. Icons: `lucide-react` only.
- **Copy**: every user-visible string lives in `src/lib/i18n/en.ts` **and** `de.ts` **and** `da.ts` (`de.ts`/`da.ts` are typed as `Dictionary`, so a missing key is a build error). German: **Sie-form** for passenger-facing copy, **du-form** for admin-facing copy. Danish is informal. Interpolate with `fill()` from `@/lib/utils`.
- **i18n is server-only** — Client Components receive strings as props. Any component awaiting `getDictionary()` sits inside `<Suspense>` with a `<Skeleton>` fallback; this is a `cacheComponents` build constraint, not a preference.
- **Formatting**: `@/lib/format` only, locale passed in explicitly, ISO for machine-readable values.
- **Spacing**: 4px grid, scale 5 · 11 · 12 · 13 · 14 · 16 · 19 · 20px, 5px default gap. No arbitrary values.
- **Passenger perspective type scale**: the shell sets `text-lg` (18px). Anything smaller is a deliberate step down.
- **Haptics**: at most one per user action, fired next to the toast in the client component that receives the Action result.
- **Commits**: one per task step group as written. Never commit unless the plan's step says so — and per `AGENTS.md` §6.8 the **user** makes the final commit on the branch; the per-task commits here are the working history they review.
- **Out of scope, deliberately**: notifications on decision (COD-180), chat in the Messages tab (COD-245), calendar/.ics (COD-181/182), rich passenger profiles (COD-150), and Functional-Ride fields (pickup/drop-off/round trip, COD-155/179). Task 7 records the schema decision the last of those will force.

---

## File Structure

**Created**

| File | Responsibility |
| --- | --- |
| `prisma/migrations/<ts>_ride_request_decision/migration.sql` | Decision columns on `ride_request` |
| `src/app/admin/rides/actions.ts` | Boundary for answering a request: guard → facade → revalidate |
| `src/app/admin/rides/_components/ride-decision.tsx` | The admin's answer buttons + decline dialog (client) |
| `src/app/passenger/rides/[id]/page.tsx` | One ride, the whole story, the cancel button |
| `src/app/passenger/profile/[passengerId]/page.tsx` | Edit one rider's details (own or managed) |
| `src/app/passenger/profile/[passengerId]/_components/rider-form.tsx` | That form (client) |
| `src/app/passenger/_components/passenger-error.tsx` | Localised client error boundary for the perspective |
| `src/app/passenger/actions.test.ts` | Guard, rate-limit and id-masking behaviour of the passenger Actions |
| `src/app/passenger/_components/ride-view.test.ts` | `cancellable` / `upcoming` derivation |
| `src/app/admin/rides/actions.test.ts` | The decision Action guards on the request's own chapter |

**Modified**

| File | Change |
| --- | --- |
| `prisma/schema.prisma` | `decidedAt`, `decidedByUserId`, `declineReason` on `RideRequest`; back-relation on `User` |
| `src/features/rides/schemas.ts` | `rideDecision`, `rideDecisionInput` |
| `src/features/rides/services/ride-requests.ts` | `updateRideRequestDecision`, widened `forPassenger` select |
| `src/features/rides/facade.ts` | `getRequest`, `decideRide`, `completeRide`; two new error reasons |
| `src/features/rides/facade.test.ts` | Cases for the two new transitions |
| `src/use-cases/request-passenger-ride.ts` | Whitelist the two failure reasons it maps (the new ones must not leak into its union) |
| `src/features/passengers/schemas.ts` | `passengerDetails` |
| `src/features/passengers/services/passengers.ts` | `updatePassengerManagedBy` (scope in the WHERE clause) |
| `src/features/passengers/facade.ts` | `updateManagedPassenger` |
| `src/app/passenger/actions.ts` | `updateRiderAction` |
| `src/app/passenger/_components/ride-view.ts` | `declineReason`, `decidedOn`, `cancelledOn` on `RideView` |
| `src/app/passenger/rides/page.tsx` | Cards become links; cancel moves to the detail page |
| `src/app/passenger/rides/_components/cancel-ride.tsx` | Redirects to the list after a successful cancel |
| `src/app/passenger/profile/page.tsx` | Edit affordance per rider |
| `src/app/passenger/layout.tsx` | Wrap children in the error boundary |
| `src/app/passenger/page.tsx` | Guest CTA copy |
| `src/app/passenger/book/page.tsx` | Horizon off-by-two |
| `src/app/admin/rides/page.tsx`, `_components/rides-table.tsx` | Answer column |
| `src/lib/i18n/{en,de,da}.ts` | All new strings |
| `docs-internal/architecture/dependency-graph.md`, `docs-internal/ARCHITECTURE.md` | The new Action → Facade edges |

---

### Task 1: The request can be answered (domain layer)

Today `updateRideRequestStatus` is only ever reached by `cancelRide`, so a request is born `requested` and dies `requested`. This task gives the domain the two transitions the whole feature rests on, and records who answered — the passenger is shown the answer verbatim, so it needs an author and a date.

**Files:**
- Modify: `prisma/schema.prisma` (`RideRequest`, `User`)
- Modify: `src/features/rides/schemas.ts`
- Modify: `src/features/rides/services/ride-requests.ts`
- Modify: `src/features/rides/facade.ts`
- Modify: `src/use-cases/request-passenger-ride.ts:64-71`
- Test: `src/features/rides/facade.test.ts`

**Interfaces:**
- Consumes: `findRideRequestById`, `updateRideRequestStatus`, `RideRequestError` (existing).
- Produces:
  - `rideDecision: z.ZodEnum<["confirmed", "declined"]>`, `type RideDecision`
  - `rideDecisionInput` → `{ decision: RideDecision; declineReason?: string }`
  - `rides.getRequest(id: string): Promise<RideRequest | null>`
  - `rides.decideRide(id: string, input: RideDecisionInput, decidedByUserId: string, now?: Date): Promise<RideRequest | null>` — `null` means "no such request"; throws `RideRequestError("alreadyDecided")` when the status is not `requested`.
  - `rides.completeRide(id: string, now?: Date): Promise<RideRequest | null>` — throws `RideRequestError("notCompletable")` unless the status is `confirmed`.
  - `PassengerRideRequest` gains `decidedAt: Date | null`, `declineReason: string | null`, `cancelledAt: Date | null`.

- [ ] **Step 1: Add the decision columns to the schema**

In `prisma/schema.prisma`, inside `model RideRequest`, replace the status block:

```prisma
  status      RideRequestStatus @default(requested)
  cancelledAt DateTime?

  /// Who answered, and when. `declineReason` is shown to the passenger word for
  /// word, so it is written by a person and never generated.
  decidedAt       DateTime?
  decidedByUserId String?
  decidedBy       User?     @relation("rideDecider", fields: [decidedByUserId], references: [id], onDelete: SetNull)
  declineReason   String?   @db.Text
```

and add to its index block:

```prisma
  @@index([decidedByUserId])
```

In `model User`, next to `rideRequests`:

```prisma
  decidedRideRequests RideRequest[]        @relation("rideDecider")
```

- [ ] **Step 2: Generate the migration**

Run: `npm run db:migrate -- --name ride_request_decision`
Expected: a new folder under `prisma/migrations/` and a regenerated client in `src/generated/prisma`.

- [ ] **Step 3: Write the failing facade tests**

Append to `src/features/rides/facade.test.ts` (the file already mocks `./services/ride-requests`; add `updateRideRequestDecision: jest.fn()` to that `jest.mock` factory and `const decide = updateRideRequestDecision as jest.Mock;` next to the other handles, importing `updateRideRequestDecision` from `./services/ride-requests` and `completeRide, decideRide` from `./facade`):

```ts
describe("decideRide", () => {
  it("stamps the answer with who gave it and when", async () => {
    byId.mockResolvedValue({ id: "r1", status: "requested" });

    await decideRide("r1", { decision: "confirmed" }, "admin1", NOW);

    expect(decide).toHaveBeenCalledWith("r1", {
      status: "confirmed",
      decidedAt: NOW,
      decidedByUserId: "admin1",
      declineReason: null,
    });
  });

  it("keeps the reason only on a decline", async () => {
    byId.mockResolvedValue({ id: "r1", status: "requested" });

    await decideRide(
      "r1",
      { decision: "confirmed", declineReason: "no pilot" },
      "admin1",
      NOW,
    );

    expect(decide).toHaveBeenCalledWith(
      "r1",
      expect.objectContaining({ declineReason: null }),
    );
  });

  it("refuses a request that was already answered", async () => {
    byId.mockResolvedValue({ id: "r1", status: "confirmed" });

    await expect(
      decideRide("r1", { decision: "declined" }, "admin1", NOW),
    ).rejects.toMatchObject({ reason: "alreadyDecided" });
    expect(decide).not.toHaveBeenCalled();
  });

  it("reports a missing request as null rather than throwing", async () => {
    byId.mockResolvedValue(null);

    await expect(
      decideRide("r1", { decision: "confirmed" }, "admin1", NOW),
    ).resolves.toBeNull();
  });
});

describe("completeRide", () => {
  it("closes a confirmed ride", async () => {
    byId.mockResolvedValue({ id: "r1", status: "confirmed" });

    await completeRide("r1", NOW);

    expect(decide).toHaveBeenCalledWith(
      "r1",
      expect.objectContaining({ status: "completed" }),
    );
  });

  it("refuses a ride nobody confirmed", async () => {
    byId.mockResolvedValue({ id: "r1", status: "requested" });

    await expect(completeRide("r1", NOW)).rejects.toMatchObject({
      reason: "notCompletable",
    });
  });
});
```

- [ ] **Step 4: Run them and watch them fail**

Run: `npx jest src/features/rides/facade.test.ts`
Expected: FAIL — `decideRide is not a function`.

- [ ] **Step 5: Add the schemas**

Append to `src/features/rides/schemas.ts`:

```ts
/** The two answers a chapter gives a request. Cancelling is the passenger's own
 *  verb and keeps its own path. */
export const rideDecision = z.enum(["confirmed", "declined"]);
export type RideDecision = z.infer<typeof rideDecision>;

export const rideDecisionInput = z.object({
  decision: rideDecision,
  declineReason: z.string().trim().max(500).optional(),
});
export type RideDecisionInput = z.infer<typeof rideDecisionInput>;
```

- [ ] **Step 6: Add the service write and widen the passenger select**

In `src/features/rides/services/ride-requests.ts`, add `cancelledAt: true, decidedAt: true, declineReason: true,` to the `forPassenger` select (after `status: true`), and append:

```ts
export const updateRideRequestDecision = (
  id: string,
  data: {
    status: RideRequestStatus;
    decidedAt: Date;
    decidedByUserId: string | null;
    declineReason: string | null;
  },
) => prisma.rideRequest.update({ where: { id }, data });
```

- [ ] **Step 7: Add the facade transitions**

In `src/features/rides/facade.ts`: extend the imports from `./schemas` with `rideDecisionInput` and `type RideDecisionInput`, extend the imports from `./services/ride-requests` with `updateRideRequestDecision`, widen the error:

```ts
export class RideRequestError extends Error {
  constructor(
    readonly reason:
      | "outOfRange"
      | "duplicate"
      | "notCancellable"
      | "alreadyDecided"
      | "notCompletable",
  ) {
    super(reason);
    this.name = "RideRequestError";
  }
}
```

and append:

```ts
export const getRequest = (id: string) => findRideRequestById(id);

/**
 * Phase 2 of the ride lifecycle, in its smallest honest form: a human answers.
 * Only a `requested` row may be answered, so two admins racing on the same list
 * cannot overwrite each other's answer — the second one is told it was decided.
 */
export async function decideRide(
  id: string,
  input: RideDecisionInput,
  decidedByUserId: string,
  now: Date = new Date(),
) {
  const { decision, declineReason } = rideDecisionInput.parse(input);

  const existing = await findRideRequestById(id);
  if (!existing) return null;
  if (existing.status !== "requested")
    throw new RideRequestError("alreadyDecided");

  return updateRideRequestDecision(id, {
    status: decision,
    decidedAt: now,
    decidedByUserId,
    // A reason belongs to a refusal. Carrying one on a confirmation would put
    // an explanation under a yes, where the passenger reads it as a caveat.
    declineReason: decision === "declined" ? (declineReason ?? null) : null,
  });
}

/** The ride happened. Only a confirmed one can have. */
export async function completeRide(id: string, now: Date = new Date()) {
  const existing = await findRideRequestById(id);
  if (!existing) return null;
  if (existing.status !== "confirmed")
    throw new RideRequestError("notCompletable");

  return updateRideRequestDecision(id, {
    status: "completed",
    decidedAt: existing.decidedAt ?? now,
    decidedByUserId: existing.decidedByUserId,
    declineReason: null,
  });
}
```

- [ ] **Step 8: Keep the new reasons out of the booking failure union**

In `src/use-cases/request-passenger-ride.ts`, the `catch` currently maps every reason but `notCancellable` into `RideRequestFailure`. Two more reasons now exist and neither is a booking failure. Replace the condition:

```ts
    if (
      error instanceof RideRequestError &&
      (error.reason === "outOfRange" || error.reason === "duplicate")
    ) {
      return { ok: false, reason: error.reason };
    }
    throw error;
```

- [ ] **Step 9: Run the suite**

Run: `npx jest src/features/rides src/use-cases/request-passenger-ride.test.ts && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 10: Commit**

```bash
git add prisma src/generated src/features/rides src/use-cases/request-passenger-ride.ts
git commit -m "feat(rides): a chapter can confirm, decline or complete a request"
```

---

### Task 2: The chapter answers, from the admin rides list

The actions sit next to the row they act on, not behind a `⋯`. Declining opens a confirmation that offers a reason, because the passenger reads that reason word for word on their own screen.

**Files:**
- Create: `src/app/admin/rides/actions.ts`
- Create: `src/app/admin/rides/_components/ride-decision.tsx`
- Create: `src/app/admin/rides/actions.test.ts`
- Modify: `src/app/admin/rides/page.tsx`, `src/app/admin/rides/_components/rides-table.tsx`
- Modify: `src/lib/i18n/{en,de,da}.ts`

**Interfaces:**
- Consumes: `rides.getRequest`, `rides.decideRide`, `rides.completeRide`, `RideRequestError`, `rideDecision` (Task 1); `requireAuth`, `requireChapterAdmin`.
- Produces: `decideRideAction(input)` and `completeRideAction(input)`, both `Promise<RideDecisionResult>` where `RideDecisionResult = { ok: true } | { ok: false; error: "alreadyDecided" | "generic" }`; `AdminRideRow` gains `canDecide: boolean` and `canComplete: boolean`.

- [ ] **Step 1: Write the failing guard test**

Create `src/app/admin/rides/actions.test.ts`:

```ts
import { decideRideAction } from "./actions";
import { requireAuth, requireChapterAdmin } from "@/lib/auth-guards";
import {
  findRideRequestById,
  updateRideRequestDecision,
} from "@/features/rides/services/ride-requests";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/auth-guards", () => ({
  requireAuth: jest.fn(),
  requireChapterAdmin: jest.fn(),
}));
jest.mock("@/features/rides/services/ride-requests", () => ({
  findOpenRideRequestOn: jest.fn(),
  findRideRequestById: jest.fn(),
  findRideRequestsOfChapters: jest.fn(),
  findRideRequestsOfPassengers: jest.fn(),
  insertRideRequest: jest.fn(),
  updateRideRequestDecision: jest.fn(),
  updateRideRequestStatus: jest.fn(),
}));

const auth = requireAuth as jest.Mock;
const guard = requireChapterAdmin as jest.Mock;
const byId = findRideRequestById as jest.Mock;
const decide = updateRideRequestDecision as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "u1" } });
  guard.mockResolvedValue({ user: { id: "admin1" } });
  byId.mockResolvedValue({ id: "r1", chapterId: "c9", status: "requested" });
});

it("guards on the chapter of the request, not one the caller sent", async () => {
  await decideRideAction({ id: "r1", decision: "confirmed" });

  expect(guard).toHaveBeenCalledWith("c9");
});

it("records the admin the guard returned as the author of the answer", async () => {
  await decideRideAction({ id: "r1", decision: "confirmed" });

  expect(decide).toHaveBeenCalledWith(
    "r1",
    expect.objectContaining({ decidedByUserId: "admin1" }),
  );
});

it("answers a second decision with alreadyDecided", async () => {
  byId.mockResolvedValue({ id: "r1", chapterId: "c9", status: "confirmed" });

  await expect(decideRideAction({ id: "r1", decision: "declined" })).resolves.toEqual(
    { ok: false, error: "alreadyDecided" },
  );
});

it("never reaches the guard for a malformed input", async () => {
  await expect(decideRideAction({ id: "", decision: "confirmed" })).resolves.toEqual(
    { ok: false, error: "generic" },
  );
  expect(guard).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest src/app/admin/rides/actions.test.ts`
Expected: FAIL — `Cannot find module './actions'`.

- [ ] **Step 3: Write the Action**

Create `src/app/admin/rides/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { rides, RideRequestError, rideDecision } from "@/features/rides";
import { requireAuth, requireChapterAdmin } from "@/lib/auth-guards";

export type RideDecisionResult =
  | { ok: true }
  | { ok: false; error: "alreadyDecided" | "generic" };

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
```

- [ ] **Step 4: Run the test**

Run: `npx jest src/app/admin/rides/actions.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Add the strings**

In `src/lib/i18n/en.ts`, inside `admin.rides`, add `actions: "Answer",` to `columns` and after `empty`:

```ts
      decide: {
        confirm: "Confirm",
        decline: "Decline",
        complete: "Mark as done",
        answered: "Answered",
        declineTitle: "Decline the ride for {rider} on {day}?",
        declineBody:
          "They see your answer straight away, and they read the reason word for word. Leaving it empty is fine.",
        reasonLabel: "Reason (optional)",
        reasonPlaceholder: "No pilot free that morning — we'll offer another day.",
        declineConfirm: "Decline the ride",
        keep: "Back",
        confirmed: "Confirmed.",
        declined: "Declined.",
        completed: "Marked as done.",
        errors: {
          alreadyDecided: "Someone answered this request already.",
          generic: "That didn't work. Try again.",
        },
      },
```

In `src/lib/i18n/de.ts`, the same block in **du-form** (admin-facing):

```ts
      decide: {
        confirm: "Zusagen",
        decline: "Absagen",
        complete: "Als gefahren markieren",
        answered: "Beantwortet",
        declineTitle: "Fahrt von {rider} am {day} absagen?",
        declineBody:
          "Die Person sieht deine Antwort sofort und liest den Grund wortwörtlich. Du kannst ihn auch leer lassen.",
        reasonLabel: "Grund (freiwillig)",
        reasonPlaceholder:
          "An dem Vormittag ist kein Pilot frei — wir bieten einen anderen Tag an.",
        declineConfirm: "Fahrt absagen",
        keep: "Zurück",
        confirmed: "Zugesagt.",
        declined: "Abgesagt.",
        completed: "Als gefahren markiert.",
        errors: {
          alreadyDecided: "Diese Anfrage wurde schon beantwortet.",
          generic: "Das hat nicht geklappt. Versuch es noch einmal.",
        },
      },
```

In `src/lib/i18n/da.ts`:

```ts
      decide: {
        confirm: "Bekræft",
        decline: "Afvis",
        complete: "Markér som kørt",
        answered: "Besvaret",
        declineTitle: "Afvis turen for {rider} den {day}?",
        declineBody:
          "Personen ser dit svar med det samme og læser begrundelsen ord for ord. Du må gerne lade den stå tom.",
        reasonLabel: "Begrundelse (valgfrit)",
        reasonPlaceholder:
          "Ingen pilot er ledig den formiddag — vi foreslår en anden dag.",
        declineConfirm: "Afvis turen",
        keep: "Tilbage",
        confirmed: "Bekræftet.",
        declined: "Afvist.",
        completed: "Markeret som kørt.",
        errors: {
          alreadyDecided: "Forespørgslen er allerede besvaret.",
          generic: "Det virkede ikke. Prøv igen.",
        },
      },
```

Also add `actions: "Antwort",` (de) and `actions: "Svar",` (da) to their `admin.rides.columns`.

- [ ] **Step 6: Build the decision cell**

Create `src/app/admin/rides/_components/ride-decision.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Dictionary } from "@/lib/i18n";
import { haptics } from "@/lib/native/haptics";
import { fill } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  completeRideAction,
  decideRideAction,
  type RideDecisionResult,
} from "../actions";

export type RideDecisionStrings = Dictionary["admin"]["rides"]["decide"];

/**
 * Three verbs, all visible. Confirming and completing are one tap because both
 * are reversible by a second admin conversation; declining is not, so it asks
 * once and offers the passenger a reason while it does.
 */
export function RideDecision({
  id,
  rider,
  day,
  canDecide,
  canComplete,
  strings,
}: {
  id: string;
  rider: string;
  day: string;
  canDecide: boolean;
  canComplete: boolean;
  strings: RideDecisionStrings;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const report = (result: RideDecisionResult, done: string) => {
    if (result.ok) {
      haptics.success();
      toast.success(done);
      return;
    }
    haptics.error();
    toast.error(strings.errors[result.error]);
  };

  if (!canDecide && !canComplete) {
    return <span className="text-2sm text-ink-soft">{strings.answered}</span>;
  }

  return (
    <div className="flex items-center gap-1.25">
      {canDecide ? (
        <>
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () =>
                report(
                  await decideRideAction({ id, decision: "confirmed" }),
                  strings.confirmed,
                ),
              )
            }
            className="h-9 rounded-full bg-mint px-4 text-2sm text-ink hover:bg-mint-deep hover:text-white"
          >
            {strings.confirm}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => setOpen(true)}
            className="h-9 rounded-full border-line px-4 text-2sm"
          >
            {strings.decline}
          </Button>
        </>
      ) : null}

      {canComplete ? (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () =>
              report(await completeRideAction({ id }), strings.completed),
            )
          }
          className="h-9 rounded-full border-line px-4 text-2sm"
        >
          {strings.complete}
        </Button>
      ) : null}

      <AlertDialog
        open={open}
        onOpenChange={setOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {fill(strings.declineTitle, { rider, day })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {strings.declineBody}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div>
            <Label
              htmlFor={`decline-reason-${id}`}
              className="mb-1.5 text-sm font-medium text-ink-soft"
            >
              {strings.reasonLabel}
            </Label>
            <Textarea
              id={`decline-reason-${id}`}
              value={reason}
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
              placeholder={strings.reasonPlaceholder}
              className="min-h-24 text-base"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>{strings.keep}</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await decideRideAction({
                    id,
                    decision: "declined",
                    declineReason: reason.trim() || undefined,
                  });
                  setOpen(false);
                  report(result, strings.declined);
                })
              }
              className="bg-red text-white hover:bg-red-hover"
            >
              {strings.declineConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

- [ ] **Step 7: Wire it into the table**

In `src/app/admin/rides/_components/rides-table.tsx`: add `canDecide: boolean;` and `canComplete: boolean;` to `AdminRideRow`, add `decide: RideDecisionStrings` to the component's props, widen `labels` with `actions: string`, and append this column definition after the existing ones:

```tsx
    {
      id: "actions",
      header: () => labels.actions,
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <div onClick={stopRowClick}>
          <RideDecision
            id={row.original.id}
            rider={row.original.rider}
            day={row.original.day}
            canDecide={row.original.canDecide}
            canComplete={row.original.canComplete}
            strings={decide}
          />
        </div>
      ),
    },
```

Import `stopRowClick` from `@/components/ui/data-table` and `RideDecision, type RideDecisionStrings` from `./ride-decision`.

- [ ] **Step 8: Feed the two flags from the server**

In `src/app/admin/rides/page.tsx`, inside the `rows` mapping add:

```ts
    canDecide: request.status === "requested",
    // Only after the day has passed: "done" is a fact, and offering it on a
    // ride that has not happened invites a chapter to tidy its list forward.
    canComplete:
      request.status === "confirmed" &&
      toIsoDateUtc(request.preferredDate) < toIsoDateUtc(new Date()),
```

and pass `decide={dict.admin.rides.decide}` plus the widened `labels={columns}` to `<RidesTable />`.

- [ ] **Step 9: Verify**

Run: `npx tsc --noEmit && npx jest && npm run lint`
Expected: all pass.

- [ ] **Step 10: Commit**

```bash
git add src/app/admin/rides src/lib/i18n
git commit -m "feat(admin): answer a ride request from the rides list"
```

---

### Task 3: The passenger's ride has a page of its own

The list card currently carries a note, a date line and a cancel button; that is a detail page wearing a list's clothes. The card becomes a link, and everything that explains one ride — including the chapter's reason for declining — moves to `/passenger/rides/[id]`.

**Files:**
- Create: `src/app/passenger/rides/[id]/page.tsx`
- Modify: `src/app/passenger/_components/ride-view.ts`
- Modify: `src/app/passenger/rides/page.tsx`
- Modify: `src/app/passenger/rides/_components/cancel-ride.tsx`
- Modify: `src/lib/i18n/{en,de,da}.ts`

**Interfaces:**
- Consumes: `listPassengerRides(userId)` (existing) — the authorised set; `toRideView` (Task 3 widens it).
- Produces: `RideView` gains `declineReason: string | null`, `decidedOn: string | null`, `cancelledOn: string | null`; route `/passenger/rides/[id]`.

- [ ] **Step 1: Widen the view model**

In `src/app/passenger/_components/ride-view.ts`, add to the `RideView` type:

```ts
  declineReason: string | null;
  decidedOn: string | null;
  cancelledOn: string | null;
```

and to the returned object in `toRideView`:

```ts
    declineReason: request.declineReason,
    decidedOn: request.decidedAt
      ? fill(dict.passenger.detail.decidedOn, {
          date: formatDate(request.decidedAt, locale),
        })
      : null,
    cancelledOn: request.cancelledAt
      ? fill(dict.passenger.detail.cancelledOn, {
          date: formatDate(request.cancelledAt, locale),
        })
      : null,
```

- [ ] **Step 2: Add the strings**

In `src/lib/i18n/en.ts`, inside `passenger`, after the `rides` block:

```ts
    detail: {
      back: "My rides",
      openAria: "Open your ride on {day}",
      rider: "Rider",
      chapter: "Chapter",
      note: "Your note",
      reason: "What your chapter wrote",
      decidedOn: "Answered on {date}",
      cancelledOn: "Cancelled on {date}",
      requestedBody:
        "Nothing is fixed yet. A volunteer will confirm the day and time with you.",
      confirmedBody:
        "Your chapter has the day. They will be in touch before the ride with the time and where to meet.",
      declinedBody:
        "Not this day, sadly. Ask for another one — most days work.",
      cancelledBody: "You cancelled this ride. You can always ask again.",
      completedBody:
        "You were out in the wind. Book the next one whenever you like.",
      book: "Book another ride",
    },
```

In `src/lib/i18n/de.ts` (Sie-form, passenger-facing):

```ts
    detail: {
      back: "Meine Fahrten",
      openAria: "Ihre Fahrt am {day} öffnen",
      rider: "Fahrgast",
      chapter: "Ortsgruppe",
      note: "Ihre Notiz",
      reason: "Das schreibt Ihre Ortsgruppe",
      decidedOn: "Am {date} beantwortet",
      cancelledOn: "Am {date} abgesagt",
      requestedBody:
        "Noch ist nichts fest. Eine freiwillige Person bestätigt Tag und Zeit mit Ihnen.",
      confirmedBody:
        "Ihre Ortsgruppe hat den Tag. Vor der Fahrt meldet sie sich mit Uhrzeit und Treffpunkt.",
      declinedBody:
        "An diesem Tag leider nicht. Fragen Sie einen anderen an — die meisten Tage klappen.",
      cancelledBody:
        "Sie haben diese Fahrt abgesagt. Sie können jederzeit wieder anfragen.",
      completedBody:
        "Sie waren im Fahrtwind unterwegs. Buchen Sie die nächste, wann immer Sie mögen.",
      book: "Noch eine Fahrt buchen",
    },
```

In `src/lib/i18n/da.ts`:

```ts
    detail: {
      back: "Mine ture",
      openAria: "Åbn din tur den {day}",
      rider: "Passager",
      chapter: "Lokalafdeling",
      note: "Din besked",
      reason: "Det skriver din lokalafdeling",
      decidedOn: "Besvaret den {date}",
      cancelledOn: "Aflyst den {date}",
      requestedBody:
        "Intet er fast endnu. En frivillig bekræfter dag og tidspunkt med dig.",
      confirmedBody:
        "Din lokalafdeling har dagen. De kontakter dig inden turen med tidspunkt og mødested.",
      declinedBody:
        "Desværre ikke den dag. Spørg om en anden — de fleste dage passer.",
      cancelledBody: "Du har aflyst denne tur. Du kan altid spørge igen.",
      completedBody:
        "Du har været ude i vinden. Book den næste, når du har lyst.",
      book: "Book en tur til",
    },
```

- [ ] **Step 3: Build the detail page**

Create `src/app/passenger/rides/[id]/page.tsx`:

```tsx
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

      <p className="mt-5 text-pretty">{body}</p>

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
```

- [ ] **Step 4: Turn the list cards into links**

In `src/app/passenger/rides/page.tsx`, replace the `<article>` in `Group` with a link and drop the note block, the `askedOn` line and `<CancelRide />` (they now live on the detail page). The `<li>` becomes:

```tsx
          <li key={ride.id}>
            <Link
              href={`/passenger/rides/${ride.id}`}
              aria-label={fill(detail.openAria, { day: ride.day })}
              className="flex items-center gap-4 rounded-(--r-card) border border-line p-5 transition-colors hover:bg-mint-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-xl font-medium">{ride.day}</span>
                <span className="block text-ink-soft">{ride.when}</span>
                {showRider ? (
                  <span className="mt-1 block text-sm text-ink-soft">
                    {ride.riderName}
                  </span>
                ) : null}
              </span>
              <RideStatus
                status={ride.status}
                label={ride.statusLabel}
                className="shrink-0"
              />
              <ChevronRight
                aria-hidden
                className="size-5 shrink-0 text-ink-soft"
              />
            </Link>
          </li>
```

`Group`'s props lose `noteLabel` and `cancel` and gain `detail: Dictionary["passenger"]["detail"]`; both call sites pass `detail={dict.passenger.detail}`. Add the `ChevronRight` import from `lucide-react`, `fill` from `@/lib/utils`, `Link` from `next/link`, and remove the now-unused `CancelRide` import.

- [ ] **Step 5: Send the cancel back to the list**

In `src/app/passenger/rides/_components/cancel-ride.tsx`, import `useRouter` from `next/navigation`, call it at the top of the component, and inside the success branch after the toast:

```ts
        router.push("/passenger/rides");
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm run lint && npx jest`
Expected: all pass.

Then start the app (`npm run dev`), sign in as a passenger with a request, and confirm: the card opens the detail page, a declined ride shows the chapter's reason, cancelling returns to the list, and a stranger's ride id gives the 404 page rather than a 403.

- [ ] **Step 7: Commit**

```bash
git add src/app/passenger src/lib/i18n
git commit -m "feat(passenger): a ride gets its own page, with the chapter's answer on it"
```

---

### Task 4: A passenger can correct the details their chapter plans from

Today only an admin can fix a misspelled name or a wrong birth date. `saveOwnPassenger` already exists for the account's own rider; managed relatives need a sibling that scopes by `managedByUserId` in the WHERE clause, so the authorisation is the query rather than a check in front of it.

**Files:**
- Modify: `src/features/passengers/schemas.ts`, `services/passengers.ts`, `facade.ts`
- Modify: `src/app/passenger/actions.ts`
- Create: `src/app/passenger/profile/[passengerId]/page.tsx`
- Create: `src/app/passenger/profile/[passengerId]/_components/rider-form.tsx`
- Modify: `src/app/passenger/profile/page.tsx`
- Modify: `src/lib/i18n/{en,de,da}.ts`

**Interfaces:**
- Produces:
  - `passengerDetails` → `{ firstName: string; lastName: string; birthDate: Date; gender: Gender }`
  - `passengers.updateManagedPassenger(id: string, managedByUserId: string, input: PassengerDetailsInput): Promise<boolean>` — `false` means the row is not this account's.
  - `updateRiderAction(input): Promise<UpdateRiderResult>` where `UpdateRiderResult = { ok: true } | { ok: false; error: "invalid" | "notYours" | "generic" }`.

- [ ] **Step 1: Write the failing facade test**

Create `src/features/passengers/facade.test.ts`:

```ts
import { updateManagedPassenger } from "./facade";
import { updatePassengerManagedBy } from "./services/passengers";

jest.mock("./services/passengers", () => ({
  countPassengersManagedBy: jest.fn(),
  findPassengerOfUser: jest.fn(),
  findPassengersManagedBy: jest.fn(),
  findPassengersOfChapters: jest.fn(),
  insertPassenger: jest.fn(),
  updatePassengerManagedBy: jest.fn(),
  upsertOwnPassenger: jest.fn(),
}));

const update = updatePassengerManagedBy as jest.Mock;

beforeEach(() => jest.clearAllMocks());

it("scopes the write to the account that manages the rider", async () => {
  update.mockResolvedValue(1);

  await updateManagedPassenger("p1", "u1", {
    firstName: "Ida",
    lastName: "Hansen",
    birthDate: new Date("1939-04-02"),
    gender: "female",
  });

  expect(update).toHaveBeenCalledWith("p1", "u1", {
    firstName: "Ida",
    lastName: "Hansen",
    birthDate: new Date("1939-04-02"),
    gender: "female",
  });
});

it("reports a rider that is not this account's as not written", async () => {
  update.mockResolvedValue(0);

  await expect(
    updateManagedPassenger("p1", "stranger", {
      firstName: "Ida",
      lastName: "Hansen",
      birthDate: new Date("1939-04-02"),
      gender: "female",
    }),
  ).resolves.toBe(false);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest src/features/passengers`
Expected: FAIL — `updateManagedPassenger is not a function`.

- [ ] **Step 3: Implement the slice**

`src/features/passengers/schemas.ts`, appended:

```ts
export const passengerDetails = passengerInput.pick({
  firstName: true,
  lastName: true,
  birthDate: true,
  gender: true,
});
export type PassengerDetailsInput = z.infer<typeof passengerDetails>;
```

`src/features/passengers/services/passengers.ts`, appended:

```ts
/** The scope is the WHERE clause on purpose: a rider id that belongs to another
 *  account matches nothing and returns 0, so there is no separate check to
 *  forget. */
export const updatePassengerManagedBy = async (
  id: string,
  managedByUserId: string,
  data: Prisma.PassengerUpdateManyMutationInput,
) =>
  (await prisma.passenger.updateMany({ where: { id, managedByUserId }, data }))
    .count;
```

`src/features/passengers/facade.ts` — add `passengerDetails` and `type PassengerDetailsInput` to the schema imports, `updatePassengerManagedBy` to the service imports, and append:

```ts
export async function updateManagedPassenger(
  id: string,
  managedByUserId: string,
  input: PassengerDetailsInput,
) {
  const data = passengerDetails.parse(input);
  return (await updatePassengerManagedBy(id, managedByUserId, data)) === 1;
}
```

- [ ] **Step 4: Run the test**

Run: `npx jest src/features/passengers`
Expected: PASS (2 tests).

- [ ] **Step 5: Add the Action**

In `src/app/passenger/actions.ts`, add `import { passengers } from "@/features/passengers";` and `import { gender } from "@/features/profile";`, then append:

```ts
export type UpdateRiderResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "notYours" | "generic" };

const riderInput = z.object({
  passengerId: z.string().min(1).max(64),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  birthDate: z.iso.date(),
  gender,
});

/**
 * Single-feature, so the Action calls the Facade directly — `AGENTS.md` §3.
 * The rider is never trusted from the form: the facade's write is scoped to the
 * account that manages it, and a miss comes back as `notYours`.
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

  const { passengerId, ...details } = parsed.data;

  try {
    const written = await passengers.updateManagedPassenger(
      passengerId,
      session.user.id,
      { ...details, birthDate: new Date(`${details.birthDate}T00:00:00Z`) },
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
```

- [ ] **Step 6: Add the strings**

In `src/lib/i18n/en.ts`, inside `passenger`, after the `profile` block add a sibling:

```ts
    rider: {
      titleOwn: "Your details",
      titleOther: "{name}'s details",
      body: "Your chapter reads these when they plan the ride.",
      firstName: "First name",
      lastName: "Last name",
      birthDate: "Date of birth",
      gender: "Gender",
      genders: { female: "Woman", male: "Man", other: "Other" },
      save: "Save",
      saving: "Saving…",
      saved: "Saved.",
      back: "Profile",
      errors: {
        invalid: "Please fill in every field.",
        notYours: "That isn't one of your riders.",
        generic: "That didn't work. Try again.",
      },
    },
```

`de.ts` (Sie-form):

```ts
    rider: {
      titleOwn: "Ihre Angaben",
      titleOther: "Angaben von {name}",
      body: "Ihre Ortsgruppe liest diese Angaben, wenn sie die Fahrt plant.",
      firstName: "Vorname",
      lastName: "Nachname",
      birthDate: "Geburtsdatum",
      gender: "Geschlecht",
      genders: { female: "Frau", male: "Mann", other: "Divers" },
      save: "Speichern",
      saving: "Wird gespeichert …",
      saved: "Gespeichert.",
      back: "Profil",
      errors: {
        invalid: "Bitte füllen Sie alle Felder aus.",
        notYours: "Das ist keine Person aus Ihrem Konto.",
        generic: "Das hat nicht geklappt. Versuchen Sie es noch einmal.",
      },
    },
```

`da.ts`:

```ts
    rider: {
      titleOwn: "Dine oplysninger",
      titleOther: "{name}s oplysninger",
      body: "Din lokalafdeling læser dem, når de planlægger turen.",
      firstName: "Fornavn",
      lastName: "Efternavn",
      birthDate: "Fødselsdato",
      gender: "Køn",
      genders: { female: "Kvinde", male: "Mand", other: "Andet" },
      save: "Gem",
      saving: "Gemmer …",
      saved: "Gemt.",
      back: "Profil",
      errors: {
        invalid: "Udfyld alle felter.",
        notYours: "Det er ikke en af dine passagerer.",
        generic: "Det virkede ikke. Prøv igen.",
      },
    },
```

- [ ] **Step 7: Build the form**

Create `src/app/passenger/profile/[passengerId]/_components/rider-form.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Dictionary } from "@/lib/i18n";
import { haptics } from "@/lib/native/haptics";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateRiderAction } from "../../../actions";

type Gender = "female" | "male" | "other";
type RiderStrings = Dictionary["passenger"]["rider"];

const GENDERS: Gender[] = ["female", "male", "other"];

export function RiderForm({
  passengerId,
  defaults,
  strings,
}: {
  passengerId: string;
  defaults: {
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: Gender;
  };
  strings: RiderStrings;
}) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(defaults.firstName);
  const [lastName, setLastName] = useState(defaults.lastName);
  const [birthDate, setBirthDate] = useState(defaults.birthDate);
  const [gender, setGender] = useState<Gender>(defaults.gender);
  const [pending, startTransition] = useTransition();

  const complete = Boolean(firstName.trim() && lastName.trim() && birthDate);

  function submit() {
    startTransition(async () => {
      const result = await updateRiderAction({
        passengerId,
        firstName,
        lastName,
        birthDate,
        gender,
      });

      if (result.ok) {
        haptics.success();
        toast.success(strings.saved);
        router.push("/passenger/profile");
        return;
      }

      haptics.error();
      toast.error(strings.errors[result.error]);
    });
  }

  return (
    <div className="mt-6 flex flex-col gap-5">
      <div>
        <Label
          htmlFor="rider-first-name"
          className="mb-1.5 text-sm font-medium text-ink-soft"
        >
          {strings.firstName}
        </Label>
        <Input
          id="rider-first-name"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          autoComplete="given-name"
          className="h-14 rounded-(--r-card) border-line text-base"
        />
      </div>

      <div>
        <Label
          htmlFor="rider-last-name"
          className="mb-1.5 text-sm font-medium text-ink-soft"
        >
          {strings.lastName}
        </Label>
        <Input
          id="rider-last-name"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          autoComplete="family-name"
          className="h-14 rounded-(--r-card) border-line text-base"
        />
      </div>

      {/* The platform date input, not a picker: already localised, already
          keyboard- and screen-reader-reachable, and on a phone it opens the OS
          wheel a 90-year-old has used before. Same call as the onboarding step. */}
      <div>
        <Label
          htmlFor="rider-birth-date"
          className="mb-1.5 text-sm font-medium text-ink-soft"
        >
          {strings.birthDate}
        </Label>
        <Input
          id="rider-birth-date"
          type="date"
          value={birthDate}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(event) => setBirthDate(event.target.value)}
          autoComplete="bday"
          className="h-14 rounded-(--r-card) border-line text-base"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-soft">
          {strings.gender}
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {GENDERS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={gender === option}
              onClick={() => {
                haptics.selectionChanged();
                setGender(option);
              }}
              className={cn(
                "min-h-14 rounded-(--r-card) border px-2 text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none",
                gender === option
                  ? "border-mint-deep bg-mint-tint font-medium text-ink"
                  : "border-line text-ink-soft hover:bg-grey-tint",
              )}
            >
              {strings.genders[option]}
            </button>
          ))}
        </div>
      </fieldset>

      <Button
        type="button"
        disabled={!complete || pending}
        onClick={submit}
        className="min-h-16 w-full rounded-(--r-tile) bg-red text-lg font-bold text-white hover:bg-red-hover"
      >
        {pending ? strings.saving : strings.save}
      </Button>
    </div>
  );
}
```

- [ ] **Step 8: Build the page**

Create `src/app/passenger/profile/[passengerId]/page.tsx`:

```tsx
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { passengers } from "@/features/passengers";
import { requirePerspective } from "@/lib/auth-guards";
import { toIsoDateUtc } from "@/lib/format";
import { getDictionary } from "@/lib/i18n";
import { fill } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { RiderForm } from "./_components/rider-form";

export default function RiderPage({
  params,
}: {
  params: Promise<{ passengerId: string }>;
}) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pt-5 pb-6">
      <Suspense fallback={<RiderSkeleton />}>
        <Rider params={params} />
      </Suspense>
    </main>
  );
}

function RiderSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-12 w-32" />
      <Skeleton className="h-10 w-52" />
      <Skeleton className="h-14 w-full rounded-(--r-card)" />
      <Skeleton className="h-14 w-full rounded-(--r-card)" />
      <Skeleton className="h-14 w-full rounded-(--r-card)" />
    </div>
  );
}

async function Rider({
  params,
}: {
  params: Promise<{ passengerId: string }>;
}) {
  const session = await requirePerspective("passenger");
  const [{ passengerId }, dict] = await Promise.all([
    params,
    getDictionary(),
  ]);

  // The authorised set, again: a rider this account does not manage is simply
  // absent, so the page 404s rather than confirming the id exists.
  const people = await passengers.listPassengersManagedBy(session.user.id);
  const person = people.find((candidate) => candidate.id === passengerId);
  if (!person) notFound();

  const strings = dict.passenger.rider;
  const own = person.userId === session.user.id;

  return (
    <>
      <Link
        href="/passenger/profile"
        className="-ml-2 flex min-h-12 w-fit items-center gap-2 rounded-full px-3 text-base text-ink-soft transition-colors hover:bg-grey-tint hover:text-ink motion-reduce:transition-none"
      >
        <ArrowLeft
          aria-hidden
          className="size-5"
        />
        {strings.back}
      </Link>

      <h1 className="mt-5 text-3xl tracking-tight">
        {own
          ? strings.titleOwn
          : fill(strings.titleOther, { name: person.firstName })}
      </h1>
      <p className="mt-2 text-ink-soft">{strings.body}</p>

      <RiderForm
        passengerId={person.id}
        defaults={{
          firstName: person.firstName,
          lastName: person.lastName,
          birthDate: toIsoDateUtc(person.birthDate),
          gender: person.gender,
        }}
        strings={strings}
      />
    </>
  );
}
```

- [ ] **Step 9: Link it from the profile**

In `src/app/passenger/profile/page.tsx`, add `edit: "Change"` / `"Ändern"` / `"Ret"` and `editAria: "Change {name}'s details"` / `"Angaben von {name} ändern"` / `"Ret {name}s oplysninger"` to `passenger.profile` in all three dictionaries, then make each rider row a link. Replace the `own` panel's `Row` pair and the `managed` map with links that reuse the existing `Panel` shell:

```tsx
      {own ? (
        <Panel title={strings.rider}>
          <RiderLink
            href={`/passenger/profile/${own.id}`}
            label={`${own.firstName} ${own.lastName}`}
            value={formatDate(own.birthDate, notation)}
            aria={fill(strings.editAria, { name: own.firstName })}
            action={strings.edit}
          />
        </Panel>
      ) : null}

      {managed.length > 0 ? (
        <Panel title={strings.managed}>
          {managed.map((person) => (
            <RiderLink
              key={person.id}
              href={`/passenger/profile/${person.id}`}
              label={`${person.firstName} ${person.lastName}`}
              value={formatDate(person.birthDate, notation)}
              aria={fill(strings.editAria, { name: person.firstName })}
              action={strings.edit}
            />
          ))}
        </Panel>
      ) : null}
```

and add next to `Row`:

```tsx
function RiderLink({
  href,
  label,
  value,
  aria,
  action,
}: {
  href: string;
  label: string;
  value: string;
  aria: string;
  action: string;
}) {
  return (
    <Link
      href={href}
      aria-label={aria}
      className="flex min-h-14 flex-wrap items-baseline justify-between gap-2 px-5 py-3 transition-colors hover:bg-mint-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none"
    >
      <span className="font-medium">{label}</span>
      <span className="flex items-baseline gap-3">
        <span className="text-2sm text-ink-soft">{value}</span>
        <span className="text-2sm font-medium underline underline-offset-4">
          {action}
        </span>
      </span>
    </Link>
  );
}
```

Add `fill` to the imports from `@/lib/utils`. Note the `own` panel now shows the name as the label rather than the static `strings.rider` — that stays as the panel title.

- [ ] **Step 10: Verify**

Run: `npx tsc --noEmit && npm run lint && npx jest`
Expected: all pass. Then in `npm run dev`: change a name, see the toast and the updated profile; open `/passenger/profile/<someone-else's-id>` and get the 404 page.

- [ ] **Step 11: Commit**

```bash
git add src/features/passengers src/app/passenger src/lib/i18n
git commit -m "feat(passenger): riders can correct their own details"
```

---

### Task 5: Test the passenger boundary

`src/app/passenger/actions.ts` carries the guard, the rate limit and the deliberate id-masking on cancel, and none of it is covered. `ride-view.ts` decides whether a cancel button appears at all. (Verified during planning: a `"use server"` module imports and runs under this jest config with the mock set below.)

**Files:**
- Create: `src/app/passenger/actions.test.ts`
- Create: `src/app/passenger/_components/ride-view.test.ts`

- [ ] **Step 1: Write the Action tests**

Create `src/app/passenger/actions.test.ts`:

```ts
import { bookRide, cancelRideRequest } from "./actions";
import { requireAuth } from "@/lib/auth-guards";
import {
  findRideRequestById,
  updateRideRequestStatus,
} from "@/features/rides/services/ride-requests";
import { requestPassengerRide } from "@/use-cases/request-passenger-ride";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/auth-guards", () => ({ requireAuth: jest.fn() }));
jest.mock("@/use-cases/request-passenger-ride", () => ({
  requestPassengerRide: jest.fn(),
}));
jest.mock("@/features/rides/services/ride-requests", () => ({
  findOpenRideRequestOn: jest.fn(),
  findRideRequestById: jest.fn(),
  findRideRequestsOfChapters: jest.fn(),
  findRideRequestsOfPassengers: jest.fn(),
  insertRideRequest: jest.fn(),
  updateRideRequestDecision: jest.fn(),
  updateRideRequestStatus: jest.fn(),
}));

const auth = requireAuth as jest.Mock;
const book = requestPassengerRide as jest.Mock;
const byId = findRideRequestById as jest.Mock;
const setStatus = updateRideRequestStatus as jest.Mock;

// The rate limiter is module state keyed by user id, so every test gets a
// fresh account rather than a reset.
let seq = 0;
const freshUser = () => {
  seq += 1;
  return { user: { id: `u${seq}` } };
};

const form = {
  preferredDate: "2099-01-02",
  timeOfDay: "morning" as const,
};

beforeEach(() => {
  jest.clearAllMocks();
  auth.mockResolvedValue(freshUser());
  book.mockResolvedValue({ ok: true, id: "r1" });
});

describe("bookRide", () => {
  it("refuses a form the schema rejects before reaching the use case", async () => {
    await expect(bookRide({ preferredDate: "not-a-day" })).resolves.toEqual({
      ok: false,
      error: "invalid",
    });
    expect(book).not.toHaveBeenCalled();
  });

  it("books for the session's own account, never an id from the form", async () => {
    const session = freshUser();
    auth.mockResolvedValue(session);

    await bookRide({ ...form, userId: "someone-else" });

    expect(book).toHaveBeenCalledWith({
      userId: session.user.id,
      form: expect.objectContaining({ preferredDate: "2099-01-02" }),
    });
  });

  it("stops after five requests in the window", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(bookRide(form)).resolves.toEqual({ ok: true });
    }

    await expect(bookRide(form)).resolves.toEqual({
      ok: false,
      error: "tooMany",
    });
  });

  it("passes a use-case refusal through as its own reason", async () => {
    book.mockResolvedValue({ ok: false, reason: "duplicate" });

    await expect(bookRide(form)).resolves.toEqual({
      ok: false,
      error: "duplicate",
    });
  });
});

describe("cancelRideRequest", () => {
  it("reports a stranger's ride as success without writing anything", async () => {
    byId.mockResolvedValue({
      id: "r1",
      requestedByUserId: "somebody-else",
      status: "requested",
    });

    await expect(cancelRideRequest("r1")).resolves.toEqual({ ok: true });
    expect(setStatus).not.toHaveBeenCalled();
  });

  it("cancels a ride the caller filed", async () => {
    const session = freshUser();
    auth.mockResolvedValue(session);
    byId.mockResolvedValue({
      id: "r1",
      requestedByUserId: session.user.id,
      status: "requested",
    });

    await expect(cancelRideRequest("r1")).resolves.toEqual({ ok: true });
    expect(setStatus).toHaveBeenCalledWith("r1", "cancelled", expect.any(Date));
  });

  it("refuses an id that is not a plausible id", async () => {
    await expect(cancelRideRequest("")).resolves.toEqual({
      ok: false,
      error: "invalid",
    });
    expect(byId).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run them**

Run: `npx jest src/app/passenger/actions.test.ts`
Expected: PASS (7 tests). If the fourth `bookRide` case fails because an earlier test consumed the window, the `freshUser()` helper is not being used in that test — fix the test, not the limiter.

- [ ] **Step 3: Write the view-model tests**

Create `src/app/passenger/_components/ride-view.test.ts`:

```ts
import { nextRideFirst, toRideView } from "./ride-view";
import en from "@/lib/i18n/en";

const request = {
  id: "r1",
  chapterId: "c1",
  passengerId: "p1",
  requestedByUserId: "u1",
  preferredDate: new Date("2026-09-20T00:00:00Z"),
  timeOfDay: "morning" as const,
  note: null,
  status: "requested" as const,
  cancelledAt: null,
  decidedAt: null,
  declineReason: null,
  createdAt: new Date("2026-09-18T10:00:00Z"),
  chapter: { name: "Aarhus", city: "Aarhus" },
  passenger: { firstName: "Ida", lastName: "Hansen" },
};

const view = (overrides: Partial<typeof request>, viewer = "u1") =>
  toRideView(
    { ...request, ...overrides },
    en,
    "da-DK",
    "2026-09-18",
    viewer,
  );

describe("cancellable", () => {
  it("is true for an open, upcoming ride the viewer filed", () => {
    expect(view({}).cancellable).toBe(true);
  });

  it("is false for someone else's request on the same rider", () => {
    expect(view({}, "u2").cancellable).toBe(false);
  });

  it("is false once the chapter has declined", () => {
    expect(view({ status: "declined" }).cancellable).toBe(false);
  });

  it("is false for a day that has passed", () => {
    expect(
      view({ preferredDate: new Date("2026-09-17T00:00:00Z") }).cancellable,
    ).toBe(false);
  });
});

describe("upcoming", () => {
  it("counts today as upcoming, not past", () => {
    expect(
      view({ preferredDate: new Date("2026-09-18T00:00:00Z") }).upcoming,
    ).toBe(true);
  });
});

describe("the chapter's answer", () => {
  it("carries the decline reason and the date it was given", () => {
    const result = view({
      status: "declined",
      declineReason: "No pilot free that morning.",
      decidedAt: new Date("2026-09-19T08:00:00Z"),
    });

    expect(result.declineReason).toBe("No pilot free that morning.");
    expect(result.decidedOn).toContain("19");
  });
});

describe("nextRideFirst", () => {
  it("puts the soonest ride first", () => {
    const soon = view({ preferredDate: new Date("2026-09-19T00:00:00Z") });
    const later = view({ preferredDate: new Date("2026-09-25T00:00:00Z") });

    expect([later, soon].sort(nextRideFirst)[0].dayIso).toBe("2026-09-19");
  });
});
```

- [ ] **Step 4: Run them**

Run: `npx jest src/app/passenger`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/passenger
git commit -m "test(passenger): cover the action boundary and the ride view model"
```

---

### Task 6: The rough edges — error boundary, horizon, guest CTA

Three small corrections that each break a promise the perspective makes.

**Files:**
- Create: `src/app/passenger/_components/passenger-error.tsx`
- Modify: `src/app/passenger/layout.tsx`
- Modify: `src/app/passenger/book/page.tsx:55`
- Modify: `src/app/passenger/page.tsx`
- Modify: `src/lib/i18n/{en,de,da}.ts`

- [ ] **Step 1: Add the error strings**

In `src/lib/i18n/en.ts`, inside `passenger`:

```ts
    error: {
      title: "That didn't load",
      body: "Something went wrong on our side. Try again — and if it keeps happening, your chapter can help.",
      retry: "Try again",
    },
```

`de.ts` (Sie-form):

```ts
    error: {
      title: "Das hat sich nicht laden lassen",
      body: "Bei uns ist etwas schiefgegangen. Versuchen Sie es noch einmal — wenn es weiter hakt, hilft Ihnen Ihre Ortsgruppe.",
      retry: "Noch einmal versuchen",
    },
```

`da.ts`:

```ts
    error: {
      title: "Det kunne ikke indlæses",
      body: "Noget gik galt hos os. Prøv igen — og bliver det ved, hjælper din lokalafdeling dig.",
      retry: "Prøv igen",
    },
```

- [ ] **Step 2: Build the boundary**

A route-level `error.tsx` is a Client Component and cannot reach `getDictionary()`, which is server-only by construction. So the boundary is rendered *by the layout*, which is a Server Component and can hand it its strings.

Create `src/app/passenger/_components/passenger-error.tsx`:

```tsx
"use client";

import { Component, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

export type PassengerErrorStrings = {
  title: string;
  body: string;
  retry: string;
};

/**
 * `error.tsx` would be simpler, but it is a Client Component and the dictionary
 * is server-only — an error page in the wrong language is its own small failure
 * for the one perspective whose readers are least able to work around it. The
 * layout renders this instead and passes the strings in.
 */
export class PassengerError extends Component<
  { strings: PassengerErrorStrings; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[passenger] render failed", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    const { title, body, retry } = this.props.strings;
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-5 px-5 py-12 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-mint-tint">
          <TriangleAlert
            aria-hidden
            className="size-7 text-ink"
          />
        </span>
        <h1 className="text-3xl tracking-tight">{title}</h1>
        <p className="text-ink-soft">{body}</p>
        <button
          type="button"
          onClick={() => {
            this.setState({ failed: false });
            window.location.reload();
          }}
          className="min-h-14 rounded-(--r-tile) bg-red px-6 font-display text-lg font-bold text-white transition-colors hover:bg-red-hover motion-reduce:transition-none"
        >
          {retry}
        </button>
      </main>
    );
  }
}
```

- [ ] **Step 3: Wrap the perspective**

In `src/app/passenger/layout.tsx`, the layout itself cannot await the dictionary without blocking the prerender, so the boundary comes in behind `<Suspense>` alongside the nav:

```tsx
export default function PassengerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-1 flex-col bg-canvas text-lg">
      <div className="flex flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <Suspense fallback={children}>
          <Guarded>{children}</Guarded>
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <Nav />
      </Suspense>
    </div>
  );
}

async function Guarded({ children }: { children: ReactNode }) {
  const dict = await getDictionary();
  return (
    <PassengerError strings={dict.passenger.error}>{children}</PassengerError>
  );
}
```

Import `PassengerError` from `./_components/passenger-error`.

- [ ] **Step 4: Close the booking-horizon gap**

`src/app/passenger/book/page.tsx:55` offers `RIDE_HORIZON_DAYS - 2` days while `rideDateWindow` accepts `RIDE_HORIZON_DAYS`, so two bookable days are unreachable. Replace the length and say why the first day is dropped:

```ts
  // From tomorrow to the last day the facade accepts. Today is left out on
  // purpose — a chapter needs a day to find a pilot — and nothing else is.
  return Array.from({ length: RIDE_HORIZON_DAYS - 1 }, (_, index) => {
```

Also update `passenger.book.dayHint` in all three dictionaries — it says "the next four weeks" while the window is thirty days: `"Pick a day in the next month."` / `"Wählen Sie einen Tag im nächsten Monat."` / `"Vælg en dag inden for den næste måned."` — and the matching `passenger.book.errors.outOfRange`: `"Please pick a day within the next month."` / `"Bitte wählen Sie einen Tag im nächsten Monat."` / `"Vælg en dag inden for den næste måned."`

- [ ] **Step 5: Make the guest CTA honest**

The guest home offers "Book a ride" in red; the route behind it requires an account, so the button promises a booking and delivers a sign-in. Keep the button — it is the right next step — and say what it does. Add to `passenger.home` in all three dictionaries:

```ts
      guestCta: "Sign in and book",
      guestHint: "It takes a minute. Your chapter needs a name to call.",
```

```ts
      guestCta: "Anmelden und buchen",
      guestHint:
        "Das dauert eine Minute. Ihre Ortsgruppe braucht einen Namen, den sie anrufen kann.",
```

```ts
      guestCta: "Log ind og book",
      guestHint: "Det tager et minut. Din lokalafdeling skal bruge et navn at ringe til.",
```

In `src/app/passenger/page.tsx`, the guest branch passes the new strings:

```tsx
      <Guest
        title={home.greetingGuest}
        body={home.guestBody}
        signIn={home.signIn}
        book={home.guestCta}
        hint={home.guestHint}
      />
```

`requireAuth` already redirects to `/sign-in?next=/passenger/book`, so the button lands them back on the booking flow after the account exists. No draft persistence — the same deliberate choice the admin drawers make.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm run lint && npx jest`
Expected: all pass. In `npm run dev`, confirm the guest home reads honestly and that the last bookable day in the list is accepted by the Action rather than refused as `outOfRange`.

- [ ] **Step 7: Commit**

```bash
git add src/app/passenger src/lib/i18n
git commit -m "fix(passenger): localised error boundary, full booking horizon, honest guest CTA"
```

---

### Task 7: Security review and documentation

`AGENTS.md` §6.11 requires a security pass after a feature, and §5 requires the dependency graph to describe every new edge.

**Files:**
- Modify: `docs-internal/architecture/dependency-graph.md`
- Modify: `docs-internal/ARCHITECTURE.md`

- [ ] **Step 1: Run the security review**

Run the `/security-review` skill over the branch diff. Confirm by hand, and record in the task notes:
- `decideRideAction` and `completeRideAction` guard on `request.chapterId`, read after `requireAuth()` and before any write — an id from the form can never select the chapter it is checked against.
- `updateRiderAction` never trusts `passengerId`: the write is `updateMany({ where: { id, managedByUserId } })`, so a foreign id updates zero rows and returns `notYours`.
- `/passenger/rides/[id]` and `/passenger/profile/[passengerId]` resolve through `listPassengerRides` / `listPassengersManagedBy` and answer `notFound()`, so neither confirms that an id exists.
- `cancelRideRequest` still reports a foreign id as success and still revalidates only on a real write.
- No new Action is reachable without a guard; no Facade gained a session parameter.

Fix anything the review turns up before continuing.

- [ ] **Step 2: Update the dependency graph**

In `docs-internal/architecture/dependency-graph.md`: add `ACT10[app/admin/rides/actions]` to the actions cluster with edges to `F5[features/rides facade]` and `F4[features/passengers facade]` for the passenger Action's new rider edge, and add two rows to the use-case table's surrounding prose:

```markdown
`app/admin/rides/actions` (ACT10) is single-feature in both directions, so both verbs call
`rides` straight: the request is read for its `chapterId`, `requireChapterAdmin` is given
that chapter, and only then is the decision written. The read-before-guard order is the
same one `app/admin/members/actions` uses for pilot applications, and for the same reason —
the caller must not be able to nominate the chapter they are checked against.

`updateRiderAction` in `app/passenger/actions` is the other half of the rule: correcting a
rider touches `passengers` alone, so there is no use case. The authorisation is inside the
query (`updateMany` scoped by `managedByUserId`), which is why the facade can stay free of
session context and still be safe to call from a script.
```

- [ ] **Step 3: Record the schema decision the next ticket inherits**

Append to `docs-internal/ARCHITECTURE.md`, under the rides slice:

```markdown
### What `RideRequest` is not, yet

`RideRequest` models phase 1 of the lifecycle and the chapter's answer to it: a day, a time
of day, a note, a status and who answered. It is deliberately *not* a `Ride`. The RFP's
Functional model (04 §Functional, requirement ID 205) needs pickup and drop-off as
first-class fields, a round trip stored as two ride events, and recurring requests that
produce many rides from one request — none of which fit this row, and all of which
COD-155/COD-179 will introduce. Treat the passenger surfaces here as written against
`RideRequest`, not against a `Ride` that does not exist yet: when the `Ride` entity lands,
`toRideView` is the single seam the passenger perspective is re-pointed through.
```

- [ ] **Step 4: Full verification**

Run: `npx tsc --noEmit && npm run lint && npx jest && npm run build`
Expected: all four pass.

- [ ] **Step 5: Commit**

```bash
git add docs-internal
git commit -m "docs: record the ride decision edges and the RideRequest boundary"
```

- [ ] **Step 6: Hand back to the user**

Per `AGENTS.md` §6.8 the user makes the final commit and opens any PR. Report: what was built, what the security pass found, and the three follow-ups this branch leaves standing — notifications on a decision (COD-180), the Messages tab (COD-245), and the `Ride` entity (COD-155/179).

---

## Self-Review

**Spec coverage.** Every item from the gap analysis that belongs to COD-176 has a task: status transitions (1), admin answer surface (2), ride detail page (3), profile editing (4), missing tests (5), error boundary + horizon + guest CTA (6), security review + docs (7). The items owned by other tickets are listed under Global Constraints as out of scope, with their ticket numbers.

**Types.** `RideDecisionInput` is produced in Task 1 and consumed in Task 2. `RideView`'s three new fields are produced in Task 3 step 1 and consumed in step 3. `PassengerDetailsInput` is produced in Task 4 step 3 and consumed in step 5. `AdminRideRow.canDecide/canComplete` is defined in Task 2 step 7 and fed in step 8. `updateRideRequestDecision` appears in every `jest.mock` factory for `services/ride-requests` written after Task 1.

**Known sequencing traps.** Task 1 step 8 is not optional: without it `tsc` fails on the widened `RideRequestError` union. Task 3 step 4 removes the only remaining consumer of `CancelRide` in the list page, so the import must go with it. Task 6 step 3 replaces the layout body wholesale rather than nesting another `<div>`.
