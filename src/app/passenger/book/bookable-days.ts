import { RIDE_HORIZON_DAYS } from "@/features/rides";
import { formatWeekdayDateLong, toIsoDateUtc, type Locale } from "@/lib/format";

export type DayOption = { iso: string; label: string; badge: string | null };

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The bookable days, written out on the server so the list is identical in both
 * renders and `Intl` never reaches the browser.
 *
 * It starts tomorrow: a chapter needs a day to find a pilot, and offering today
 * would mostly produce requests nobody can honour. It ends on the last day
 * `rideDateWindow` accepts — `RIDE_HORIZON_DAYS` entries reach exactly that day,
 * because the first entry is already one day out. A shorter list would refuse
 * days the domain allows, without ever saying so.
 */
export function bookableDays(
  locale: Locale,
  tomorrowLabel: string,
  now: Date = new Date(),
): DayOption[] {
  const start = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  return Array.from({ length: RIDE_HORIZON_DAYS }, (_, index) => {
    const date = new Date(start + (index + 1) * DAY_MS);
    return {
      iso: toIsoDateUtc(date),
      label: formatWeekdayDateLong(date, locale),
      badge: index === 0 ? tomorrowLabel : null,
    };
  });
}
