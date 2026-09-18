"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Gender } from "@/features/profile";
import type { Locale } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import { haptics } from "@/lib/native/haptics";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { updateRiderAction } from "../../actions";
import { EditableRow } from "./editable-row";
import {
  displayValue,
  hasChanged,
  isComplete,
  normalise,
  RIDER_FIELDS,
  type RiderField,
  type RiderValues,
} from "./rider-fields";

type RiderStrings = Dictionary["passenger"]["rider"];

const GENDERS: Gender[] = ["female", "male", "other"];

/**
 * One rider's four facts, each editable where it stands.
 *
 * The panel — not the row — owns the values, because `updateRiderAction`
 * validates the four together: a single row cannot post on its own. Holding the
 * set here means there is no partial-update path to get wrong, and the Action,
 * its guard and its tests stay exactly as they are.
 *
 * One row is open at a time. Opening another discards what was typed in the
 * first, the same contract the admin drawers make: nothing half-written
 * survives out of sight.
 */
export function RiderPanel({
  passengerId,
  title,
  initial,
  locale,
  strings,
  // The panel does not know whether it stands alone or under a group heading,
  // and a guessed level is how heading order breaks for a screen reader.
  level = 2,
}: {
  passengerId: string;
  title: string;
  initial: RiderValues;
  locale: Locale;
  strings: RiderStrings;
  level?: 2 | 3;
}) {
  const [saved, setSaved] = useState(initial);
  const [values, setValues] = useState(initial);
  const [openField, setOpenField] = useState<RiderField | null>(null);
  const [pending, startTransition] = useTransition();

  const open = (field: RiderField) => {
    setValues(saved);
    setOpenField(field);
  };

  const cancel = () => {
    setValues(saved);
    setOpenField(null);
  };

  function save() {
    const next = normalise(values);

    startTransition(async () => {
      const result = await updateRiderAction({ passengerId, ...next });

      if (result.ok) {
        haptics.success();
        toast.success(strings.saved);
        setSaved(next);
        setValues(next);
        setOpenField(null);
        return;
      }

      // The row stays open and keeps what was typed: the answer to "that isn't
      // one of your riders" is not to silently throw the edit away.
      haptics.error();
      toast.error(strings.errors[result.error]);
    });
  }

  const set = (field: RiderField, value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  const Heading = level === 3 ? "h3" : "h2";

  return (
    <section className="mt-6">
      <Heading className="text-2sm font-semibold tracking-wide text-ink-soft uppercase">
        {title}
      </Heading>
      <div className="mt-3 divide-y divide-line overflow-hidden rounded-(--r-card) border border-line">
        {RIDER_FIELDS.map((field) => (
          <EditableRow
            key={field}
            label={strings[field]}
            value={displayValue(field, saved, locale, strings.genders)}
            open={openField === field}
            pending={pending}
            canSave={isComplete(values) && hasChanged(values, saved)}
            onOpen={() => open(field)}
            onCancel={cancel}
            onSave={save}
            strings={strings}
          >
            <Field
              field={field}
              values={values}
              set={set}
              strings={strings}
            />
          </EditableRow>
        ))}
      </div>
    </section>
  );
}

function Field({
  field,
  values,
  set,
  strings,
}: {
  field: RiderField;
  values: RiderValues;
  set: (field: RiderField, value: string) => void;
  strings: RiderStrings;
}) {
  if (field === "gender") {
    return (
      <div className="grid grid-cols-3 gap-2">
        {GENDERS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={values.gender === option}
            onClick={() => {
              haptics.selectionChanged();
              set("gender", option);
            }}
            className={cn(
              "min-h-14 rounded-(--r-card) border px-2 text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none",
              values.gender === option
                ? "border-mint-deep bg-mint-tint font-medium text-ink"
                : "border-line bg-canvas text-ink-soft hover:bg-grey-tint",
            )}
          >
            {strings.genders[option]}
          </button>
        ))}
      </div>
    );
  }

  // The platform date input, not a picker component: already localised, already
  // keyboard- and screen-reader-reachable, and on a phone it opens the OS wheel.
  // It only ever renders after a tap, so its `max` never reaches a server render.
  if (field === "birthDate") {
    return (
      <Input
        type="date"
        autoFocus
        value={values.birthDate}
        max={new Date().toISOString().slice(0, 10)}
        onChange={(event) => set("birthDate", event.target.value)}
        autoComplete="bday"
        className="h-14 rounded-(--r-card) border-line bg-canvas text-base"
      />
    );
  }

  return (
    <Input
      autoFocus
      value={values[field]}
      onChange={(event) => set(field, event.target.value)}
      autoComplete={field === "firstName" ? "given-name" : "family-name"}
      className="h-14 rounded-(--r-card) border-line bg-canvas text-base"
    />
  );
}
