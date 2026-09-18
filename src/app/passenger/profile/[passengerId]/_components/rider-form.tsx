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

/**
 * One screen, one Save. The rest of this perspective answers a question and
 * moves on by itself, but a correction is not a question — someone came here to
 * change one thing among four and needs to see all four before committing.
 */
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

      {/* The platform date input, not a picker component: already localised,
          already keyboard- and screen-reader-reachable, and on a phone it opens
          the OS wheel. The same call the onboarding step makes. */}
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
