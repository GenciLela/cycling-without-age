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
