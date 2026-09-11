/**
 * Locale-aware formatting. See `.claude/skills/frontend` § Formatting.
 *
 * Two independent axes, and conflating them is the classic bug:
 *   - the LOCALE decides how a value is written (date order, 12h/24h, separators)
 *   - the CURRENCY decides what the money is, and comes from the data
 * A €50 ride is €50 whether it is read in Munich or Denver.
 *
 * Every function takes the locale explicitly. That is deliberate: a module-level
 * formatter with a baked-in locale is how this file previously pinned everything
 * to `de-DE`, and nothing at the call site made that visible.
 */

export const SUPPORTED_LOCALES = ["en-US", "en-GB", "de-DE", "da-DK"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Used only when negotiation finds no match. English wording with European
 * date/time conventions, which suits a Denmark-founded movement documenting
 * itself in English. Change this one constant to move the default.
 */
export const FALLBACK_LOCALE: Locale = "en-GB";

function isSupported(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Pick a supported locale from an `Accept-Language` header, `navigator.languages`,
 * or a stored preference. Falls back to the language subtag (`de` → `de-DE`) before
 * giving up.
 *
 * Call this ON THE SERVER and pass the result down. Resolving it during client
 * render makes the server and client format differently, which React reports as a
 * hydration mismatch.
 */
export function resolveLocale(
  preferred: string | readonly string[] | null | undefined,
): Locale {
  if (!preferred) return FALLBACK_LOCALE;

  const candidates = (
    typeof preferred === "string" ? preferred.split(",") : preferred
  )
    // strip Accept-Language quality values: "de-DE;q=0.9" → "de-DE"
    .map((tag) => tag.split(";")[0]?.trim())
    .filter((tag): tag is string => Boolean(tag));

  for (const tag of candidates) {
    if (isSupported(tag)) return tag;
    const language = tag.split("-")[0]?.toLowerCase();
    const byLanguage = SUPPORTED_LOCALES.find(
      (locale) => locale.split("-")[0] === language,
    );
    if (byLanguage) return byLanguage;
  }

  return FALLBACK_LOCALE;
}

/* -------------------------------------------------------------------------- */
/* Formatter cache — constructing Intl.* is slow, and components re-render.    */
/* -------------------------------------------------------------------------- */

const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();
const numberFormatters = new Map<string, Intl.NumberFormat>();

function dateTimeFormatter(
  locale: Locale,
  options: Intl.DateTimeFormatOptions,
) {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = dateTimeFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    dateTimeFormatters.set(key, formatter);
  }
  return formatter;
}

function numberFormatter(locale: Locale, options: Intl.NumberFormatOptions) {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = numberFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numberFormatters.set(key, formatter);
  }
  return formatter;
}

const regionNamesByLocale = new Map<string, Intl.DisplayNames>();
const collators = new Map<string, Intl.Collator>();

/** Localised country names: `regionNames("de").of("DK")` is "Dänemark". */
export function regionNames(locale: string) {
  let names = regionNamesByLocale.get(locale);
  if (!names) {
    names = new Intl.DisplayNames([locale], { type: "region" });
    regionNamesByLocale.set(locale, names);
  }
  return names;
}

/** Locale-aware ordering: `list.sort(collator(locale).compare)`. */
export function collator(locale: string) {
  let value = collators.get(locale);
  if (!value) {
    value = new Intl.Collator(locale);
    collators.set(locale, value);
  }
  return value;
}

const listFormatters = new Map<Locale, Intl.ListFormat>();

function listFormatter(locale: Locale) {
  let formatter = listFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.ListFormat(locale, {
      style: "long",
      type: "conjunction",
    });
    listFormatters.set(locale, formatter);
  }
  return formatter;
}

/** `a pilot and a chapter admin` (en) · `Pilot und Ortsgruppen-Admin` (de) */
export function formatList(items: string[], locale: Locale): string {
  return listFormatter(locale).format(items);
}

/* -------------------------------------------------------------------------- */
/* Calendar dates — no time, no zone                                          */
/* -------------------------------------------------------------------------- */

/**
 * A calendar date carries no time and no zone, so it is parsed AND formatted in
 * UTC. Both halves must agree: parsing `2026-03-07` as local midnight and then
 * formatting in UTC would render 6 March for anyone east of Greenwich.
 *
 * Accepts a `YYYY-MM-DD` string or a UTC-midnight `Date` (what Prisma returns for
 * `@db.Date`). For a Date picked in the user's own zone, normalise it with
 * `toIsoDateLocal` first, or the calendar day can shift.
 */
function toCalendarDate(value: Date | string): Date {
  if (value instanceof Date) return value;
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00Z`)
    : new Date(value);
}

const CALENDAR_UTC = { timeZone: "UTC" } as const;

/** `03/07/2026` (en-US) · `07/03/2026` (en-GB) · `07.03.2026` (de-DE) */
export function formatDate(value: Date | string, locale: Locale): string {
  return dateTimeFormatter(locale, {
    ...CALENDAR_UTC,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(toCalendarDate(value));
}

/** `March 2026` (en-US) · `März 2026` (de-DE) */
export function formatMonthYearLong(
  value: Date | string,
  locale: Locale,
): string {
  return dateTimeFormatter(locale, {
    ...CALENDAR_UTC,
    year: "numeric",
    month: "long",
  }).format(toCalendarDate(value));
}

/**
 * `Saturday, 7 March` (en-GB) · `Samstag, 7. März` (de-DE). No year: it reads
 * the way a day is spoken, and every surface using it looks a month ahead at
 * most, so the year would be noise rather than information.
 */
export function formatWeekdayDateLong(
  value: Date | string,
  locale: Locale,
): string {
  return dateTimeFormatter(locale, {
    ...CALENDAR_UTC,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(toCalendarDate(value));
}

/** `Sat, 03/07` (en-US) · `Sa., 07.03.` (de-DE) */
export function formatShortDateWithWeekday(
  value: Date | string,
  locale: Locale,
): string {
  return dateTimeFormatter(locale, {
    ...CALENDAR_UTC,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(toCalendarDate(value));
}

/* -------------------------------------------------------------------------- */
/* Instants — a real moment, so the zone is mandatory                         */
/* -------------------------------------------------------------------------- */

/**
 * `timeZone` is required, not defaulted. Leaving it to the runtime means the
 * server (UTC) and the browser (the reader's zone) disagree, which surfaces as a
 * hydration mismatch and, near midnight, as the wrong day.
 *
 * Never pass `hour12` — `en-US` resolves to 12h and `de-DE` to 24h on their own.
 */
export function formatTime(
  value: Date | string,
  locale: Locale,
  timeZone: string,
): string {
  // `timeStyle` rather than hour/minute: `hour: "2-digit"` pads en-US to
  // "02:30 PM", which no American writes. Let the locale choose its own shape.
  return dateTimeFormatter(locale, {
    timeZone,
    timeStyle: "short",
  }).format(new Date(value));
}

/** `3/7/26, 2:30 PM` (en-US) · `07.03.26, 14:30` (de-DE) */
export function formatDateTime(
  value: Date | string,
  locale: Locale,
  timeZone: string,
): string {
  return dateTimeFormatter(locale, {
    timeZone,
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

const relativeTimeFormatters = new Map<string, Intl.RelativeTimeFormat>();

// ponytail: 30-day months and 365-day years — this labels a feed line, it is not a
// calendar. Switch to a date library if anyone needs "1 month ago" to be exact.
const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
];

/**
 * `4d ago` (en-US) · `vor 4 Tagen` (de-DE) · `now` inside a minute. `now` is a
 * parameter so one render uses one clock and a test can pin it.
 */
export function formatRelativeTime(
  value: Date | string,
  locale: Locale,
  now: Date = new Date(),
): string {
  let formatter = relativeTimeFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(locale, {
      numeric: "auto",
      style: "narrow",
    });
    relativeTimeFormatters.set(locale, formatter);
  }
  const seconds = Math.round(
    (new Date(value).getTime() - now.getTime()) / 1000,
  );
  const unit = RELATIVE_UNITS.find(([, size]) => Math.abs(seconds) >= size);
  if (!unit) return formatter.format(0, "second");
  return formatter.format(Math.trunc(seconds / unit[1]), unit[0]);
}

/**
 * Relative times and durations come out as words — "2 min ago", "vor 2 Min." —
 * so they follow the language the UI is in, not the notation the browser asked
 * for. "Saved jetzt" is the bug this prevents. Dates, numbers and distances keep
 * using the notation locale from `resolveLocale`.
 */
export function wordsLocale(language: string): Locale {
  return resolveLocale(language);
}

/* -------------------------------------------------------------------------- */
/* Numbers and money                                                          */
/* -------------------------------------------------------------------------- */

/** `1,234.56` (en-US) · `1.234,56` (de-DE) */
export function formatNumber(
  value: number,
  locale: Locale,
  options: Intl.NumberFormatOptions = {},
): string {
  return numberFormatter(locale, options).format(value);
}

/**
 * `currency` is an ISO 4217 code that comes from the DATA — the chapter's own
 * currency — never from the reader's locale. Deriving it from the locale turns a
 * €50 ride into $50 for a US reader: same number, wrong amount, no error.
 *
 * The locale still governs notation, so 50 EUR reads as `€50.00` in en-US and
 * `50,00 €` in de-DE. Same money, different writing.
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale: Locale,
): string {
  return numberFormatter(locale, { style: "currency", currency }).format(
    amount,
  );
}

/* -------------------------------------------------------------------------- */
/* Machine-readable — deliberately locale-independent                         */
/* -------------------------------------------------------------------------- */

/** `YYYY-MM-DD` from UTC components. For `@db.Date` values out of Prisma. */
export function toIsoDateUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** `YYYY-MM-DD` from local components. For dates the user picked. */
export function toIsoDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const IMPERIAL_LOCALES: readonly Locale[] = ["en-US"];

const METRES_PER_MILE = 1609.344;

export function formatDistance(meters: number, locale: Locale): string {
  if (IMPERIAL_LOCALES.includes(locale)) {
    const miles = meters / METRES_PER_MILE;
    return numberFormatter(locale, {
      style: "unit",
      unit: "mile",
      unitDisplay: "short",
      maximumFractionDigits: miles < 10 ? 1 : 0,
    }).format(miles);
  }

  if (meters < 1000) {
    return numberFormatter(locale, {
      style: "unit",
      unit: "meter",
      unitDisplay: "short",
      maximumFractionDigits: 0,
    }).format(Math.round(meters / 10) * 10);
  }

  const km = meters / 1000;
  return numberFormatter(locale, {
    style: "unit",
    unit: "kilometer",
    unitDisplay: "short",
    maximumFractionDigits: km < 10 ? 1 : 0,
  }).format(km);
}

/**
 * A ride length a person reads: `8 min`, `1 hr 20 min`.
 *
 * Rounded up to the whole minute — an estimate that says "9 min" and takes ten is
 * worse than one that says ten. `Intl.NumberFormat` with a unit rather than a
 * hand-rolled string, so `de-DE` gets "Min." and `da-DK` gets "min." for free.
 */
export function formatDuration(seconds: number, locale: Locale): string {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  const unit = (value: number, unit: "hour" | "minute") =>
    numberFormatter(locale, {
      style: "unit",
      unit,
      unitDisplay: "short",
      maximumFractionDigits: 0,
    }).format(value);

  if (minutes < 60) return unit(minutes, "minute");
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0
    ? unit(hours, "hour")
    : `${unit(hours, "hour")} ${unit(rest, "minute")}`;
}
