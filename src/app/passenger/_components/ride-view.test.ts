import { nextRideFirst, toRideView } from "./ride-view";
import type { PassengerRideRequest } from "@/features/rides";
import en from "@/lib/i18n/en";

// Typed as the domain row rather than inferred, so `status` keeps its whole
// union and the nullable columns stay nullable — an inferred fixture narrows
// every field to the one value it happens to hold.
const request: PassengerRideRequest = {
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

const view = (overrides: Partial<PassengerRideRequest>, viewer = "u1") =>
  toRideView({ ...request, ...overrides }, en, "da-DK", "2026-09-18", viewer);

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

  it("leaves the answer lines empty while nobody has answered", () => {
    const result = view({});

    expect(result.decidedOn).toBeNull();
    expect(result.cancelledOn).toBeNull();
  });
});

describe("nextRideFirst", () => {
  it("puts the soonest ride first", () => {
    const soon = view({ preferredDate: new Date("2026-09-19T00:00:00Z") });
    const later = view({ preferredDate: new Date("2026-09-25T00:00:00Z") });

    expect([later, soon].sort(nextRideFirst)[0].dayIso).toBe("2026-09-19");
  });
});
