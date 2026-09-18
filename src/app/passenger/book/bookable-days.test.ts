import { bookableDays } from "./bookable-days";
import { rides } from "@/features/rides";
import { toIsoDateUtc } from "@/lib/format";

const NOW = new Date("2026-09-18T09:00:00Z");

const days = () => bookableDays("da-DK", "I morgen", NOW);

it("starts tomorrow, because a chapter needs a day to find a pilot", () => {
  expect(days()[0].iso).toBe("2026-09-19");
});

it("offers every day the facade would accept, right up to the last one", () => {
  const { to } = rides.rideDateWindow(NOW);
  const offered = days();

  expect(offered[offered.length - 1].iso).toBe(toIsoDateUtc(to));
});

it("offers no day the facade would refuse", () => {
  const { from, to } = rides.rideDateWindow(NOW);

  for (const day of days()) {
    const date = new Date(`${day.iso}T00:00:00Z`);
    expect(date >= from && date <= to).toBe(true);
  }
});

it("badges only the first day", () => {
  const badged = days().filter((day) => day.badge !== null);

  expect(badged).toHaveLength(1);
  expect(badged[0].iso).toBe("2026-09-19");
});
