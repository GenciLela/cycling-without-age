import {
  cancelRide,
  requestRide,
  rideDateWindow,
  RideRequestError,
} from "./facade";
import {
  findOpenRideRequestOn,
  findRideRequestById,
  insertRideRequest,
  updateRideRequestStatus,
} from "./services/ride-requests";

jest.mock("./services/ride-requests", () => ({
  findOpenRideRequestOn: jest.fn(),
  findRideRequestById: jest.fn(),
  findRideRequestsOfChapters: jest.fn(),
  findRideRequestsOfPassengers: jest.fn(),
  insertRideRequest: jest.fn(),
  updateRideRequestStatus: jest.fn(),
}));

const clash = findOpenRideRequestOn as jest.Mock;
const byId = findRideRequestById as jest.Mock;
const insert = insertRideRequest as jest.Mock;
const setStatus = updateRideRequestStatus as jest.Mock;

const NOW = new Date("2026-09-11T09:00:00Z");

const input = {
  chapterId: "c1",
  passengerId: "p1",
  requestedByUserId: "u1",
  preferredDate: "2026-09-12",
  timeOfDay: "morning" as const,
};

beforeEach(() => {
  jest.clearAllMocks();
  clash.mockResolvedValue(null);
  insert.mockResolvedValue({ id: "r1" });
});

describe("rideDateWindow", () => {
  it("opens on UTC today so no local tomorrow reads as the past", () => {
    const { from, to } = rideDateWindow(NOW);
    expect(from.toISOString()).toBe("2026-09-11T00:00:00.000Z");
    expect(to.toISOString()).toBe("2026-10-11T00:00:00.000Z");
  });
});

describe("requestRide", () => {
  it("stores the picked day as that day, not the one after it", async () => {
    await requestRide(input, NOW);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        preferredDate: new Date("2026-09-12T00:00:00.000Z"),
        note: null,
      }),
    );
  });

  it("refuses a day in the past", async () => {
    await expect(
      requestRide({ ...input, preferredDate: "2026-09-01" }, NOW),
    ).rejects.toMatchObject({ reason: "outOfRange" });
    expect(insert).not.toHaveBeenCalled();
  });

  /* `new Date("2026-13-01…")` is Invalid Date, and every `<`/`>` against NaN is
     false — so without an explicit check the window guard would wave it past
     rather than catch it. The schema refuses it too; both layers are tested. */
  it("refuses a day that is not a real calendar date", async () => {
    for (const day of ["2026-13-01", "2026-02-31"]) {
      await expect(
        requestRide({ ...input, preferredDate: day }, NOW),
      ).rejects.toBeDefined();
    }
    expect(insert).not.toHaveBeenCalled();
  });

  it("refuses a day beyond the horizon", async () => {
    await expect(
      requestRide({ ...input, preferredDate: "2026-11-01" }, NOW),
    ).rejects.toMatchObject({ reason: "outOfRange" });
    expect(insert).not.toHaveBeenCalled();
  });

  it("refuses a second open request on the same day", async () => {
    clash.mockResolvedValue({ id: "r-existing" });
    await expect(requestRide(input, NOW)).rejects.toBeInstanceOf(
      RideRequestError,
    );
    expect(insert).not.toHaveBeenCalled();
  });

  it("keeps a note when there is one", async () => {
    await requestRide({ ...input, note: "  a walking frame  " }, NOW);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ note: "a walking frame" }),
    );
  });
});

describe("cancelRide", () => {
  it("cancels a request the caller filed", async () => {
    byId.mockResolvedValue({
      id: "r1",
      requestedByUserId: "u1",
      status: "requested",
    });
    await cancelRide("r1", "u1");
    expect(setStatus).toHaveBeenCalledWith("r1", "cancelled", expect.any(Date));
  });

  /* Someone else's id must not become someone else's cancel button. */
  it("does nothing for a request filed by another account", async () => {
    byId.mockResolvedValue({
      id: "r1",
      requestedByUserId: "u2",
      status: "requested",
    });
    await expect(cancelRide("r1", "u1")).resolves.toBeNull();
    expect(setStatus).not.toHaveBeenCalled();
  });

  it("does nothing for a request that does not exist", async () => {
    byId.mockResolvedValue(null);
    await expect(cancelRide("r1", "u1")).resolves.toBeNull();
    expect(setStatus).not.toHaveBeenCalled();
  });

  it("refuses to cancel a ride that is already over", async () => {
    byId.mockResolvedValue({
      id: "r1",
      requestedByUserId: "u1",
      status: "completed",
    });
    await expect(cancelRide("r1", "u1")).rejects.toMatchObject({
      reason: "notCancellable",
    });
    expect(setStatus).not.toHaveBeenCalled();
  });
});
