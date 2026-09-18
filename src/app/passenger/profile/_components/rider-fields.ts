import type { Gender } from "@/features/profile";
import { formatDate, type Locale } from "@/lib/format";

/**
 * One rider's editable set. `birthDate` is the ISO calendar day the platform
 * date input speaks; everything that shows it to a person goes through
 * `displayValue`, so no component formats a date by hand.
 */
export type RiderValues = {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: Gender;
};

export const RIDER_FIELDS = [
  "firstName",
  "lastName",
  "birthDate",
  "gender",
] as const;

export type RiderField = (typeof RIDER_FIELDS)[number];

export type GenderLabels = Record<Gender, string>;

/** Names lose their padding on the way out — `updateRiderAction` trims too, so
 *  a row that only gained a space has not actually changed. */
export const normalise = (values: RiderValues): RiderValues => ({
  ...values,
  firstName: values.firstName.trim(),
  lastName: values.lastName.trim(),
});

/** What the Action will accept. Gender is a closed set and always holds. */
export function isComplete(values: RiderValues): boolean {
  const { firstName, lastName, birthDate } = normalise(values);
  return Boolean(firstName && lastName && birthDate);
}

export function hasChanged(next: RiderValues, saved: RiderValues): boolean {
  const a = normalise(next);
  const b = normalise(saved);
  return RIDER_FIELDS.some((field) => a[field] !== b[field]);
}

/** What the collapsed row reads. An empty birth date stays empty rather than
 *  becoming an Invalid Date. */
export function displayValue(
  field: RiderField,
  values: RiderValues,
  locale: Locale,
  genders: GenderLabels,
): string {
  if (field === "gender") return genders[values.gender];
  if (field !== "birthDate") return values[field];
  return values.birthDate ? formatDate(values.birthDate, locale) : "";
}
