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

  await expect(
    decideRideAction({ id: "r1", decision: "declined" }),
  ).resolves.toEqual({ ok: false, error: "alreadyDecided" });
});

it("never reaches the guard for a malformed input", async () => {
  await expect(
    decideRideAction({ id: "", decision: "confirmed" }),
  ).resolves.toEqual({ ok: false, error: "generic" });
  expect(guard).not.toHaveBeenCalled();
});
