import { requestPassengerRide } from "./request-passenger-ride";
import { membership } from "@/features/membership";
import { passengers } from "@/features/passengers";
import { rides, RideRequestError } from "@/features/rides";

jest.mock("@/features/membership", () => ({
  membership: { getMemberRoles: jest.fn() },
}));
jest.mock("@/features/passengers", () => ({
  passengers: { listPassengersManagedBy: jest.fn() },
}));
jest.mock("@/features/rides", () => {
  class RideRequestError extends Error {
    constructor(readonly reason: string) {
      super(reason);
    }
  }
  return { rides: { requestRide: jest.fn() }, RideRequestError };
});

const listed = passengers.listPassengersManagedBy as jest.Mock;
const roles = membership.getMemberRoles as jest.Mock;
const write = rides.requestRide as jest.Mock;

const ANNA = { id: "p1", chapterId: "c1" };
const GRETE = { id: "p2", chapterId: "c1" };

const form = {
  preferredDate: "2026-09-20",
  timeOfDay: "morning" as const,
};

beforeEach(() => {
  jest.clearAllMocks();
  roles.mockResolvedValue(["passenger"]);
  write.mockResolvedValue({ id: "r1" });
});

describe("requestPassengerRide", () => {
  it("books for the only rider on the account without being told which", async () => {
    listed.mockResolvedValue([ANNA]);

    await expect(requestPassengerRide({ userId: "u1", form })).resolves.toEqual(
      { ok: true, id: "r1" },
    );

    expect(write).toHaveBeenCalledWith(
      expect.objectContaining({
        chapterId: "c1",
        passengerId: "p1",
        requestedByUserId: "u1",
      }),
    );
  });

  /* The authorisation. `listPassengersManagedBy` is scoped to the caller, so a
     posted id that is not in it belongs to someone else — and nothing further
     down re-checks, which is what makes this test the one that matters. */
  it("refuses a passenger id the account does not manage", async () => {
    listed.mockResolvedValue([ANNA, GRETE]);

    await expect(
      requestPassengerRide({
        userId: "u1",
        form: { ...form, passengerId: "p-someone-else" },
      }),
    ).resolves.toEqual({ ok: false, reason: "unknownPassenger" });

    expect(write).not.toHaveBeenCalled();
  });

  it("refuses to guess when the account manages several riders", async () => {
    listed.mockResolvedValue([ANNA, GRETE]);

    await expect(requestPassengerRide({ userId: "u1", form })).resolves.toEqual(
      {
        ok: false,
        reason: "unknownPassenger",
      },
    );
    expect(write).not.toHaveBeenCalled();
  });

  /* A `Passenger` row outlives the `Member` row — nothing cascades between
     them — so removal from a chapter has to be checked at booking time, or
     someone a chapter just removed keeps filing into that chapter's list. */
  it("refuses once the chapter has ended the membership", async () => {
    listed.mockResolvedValue([ANNA]);
    roles.mockResolvedValue([]);

    await expect(requestPassengerRide({ userId: "u1", form })).resolves.toEqual(
      {
        ok: false,
        reason: "notAMember",
      },
    );
    expect(write).not.toHaveBeenCalled();
  });

  it("refuses when only the passenger role was revoked", async () => {
    listed.mockResolvedValue([ANNA]);
    roles.mockResolvedValue(["pilot"]);

    await expect(requestPassengerRide({ userId: "u1", form })).resolves.toEqual(
      {
        ok: false,
        reason: "notAMember",
      },
    );
    expect(write).not.toHaveBeenCalled();
  });

  it("checks membership against the rider's chapter, not a posted one", async () => {
    listed.mockResolvedValue([ANNA]);
    await requestPassengerRide({ userId: "u1", form });
    expect(roles).toHaveBeenCalledWith("u1", "c1");
  });

  it("reports an account with no rider at all", async () => {
    listed.mockResolvedValue([]);

    await expect(requestPassengerRide({ userId: "u1", form })).resolves.toEqual(
      {
        ok: false,
        reason: "noPassenger",
      },
    );
    expect(write).not.toHaveBeenCalled();
  });

  it("passes the facade's own refusals back as reasons", async () => {
    listed.mockResolvedValue([ANNA]);
    write.mockRejectedValue(new RideRequestError("duplicate"));

    await expect(requestPassengerRide({ userId: "u1", form })).resolves.toEqual(
      {
        ok: false,
        reason: "duplicate",
      },
    );
  });

  it("lets an unexpected failure through rather than reporting success", async () => {
    listed.mockResolvedValue([ANNA]);
    write.mockRejectedValue(new Error("database is on fire"));

    await expect(requestPassengerRide({ userId: "u1", form })).rejects.toThrow(
      "database is on fire",
    );
  });
});
