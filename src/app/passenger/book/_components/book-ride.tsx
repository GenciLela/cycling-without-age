"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { RideTimeOfDay } from "@/features/rides";
import type { Dictionary } from "@/lib/i18n";
import { haptics } from "@/lib/native/haptics";
import { cn, fill } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { bookRide } from "../../actions";

export type DayOption = { iso: string; label: string; badge: string | null };
type Person = { id: string; name: string };

type BookStrings = Dictionary["passenger"]["book"];
type WhenStrings = Dictionary["passenger"]["when"];

const TIMES: RideTimeOfDay[] = ["morning", "afternoon", "any"];

/**
 * One question per screen, and answering it moves on by itself — a "Continue"
 * button under a list someone has just tapped is a second decision about a
 * choice they already made. Back is always there, so nothing is a trap.
 */
export function BookRide({
  days,
  people,
  chapterName,
  strings,
  when: whenLabels,
}: {
  days: DayOption[];
  people: Person[];
  chapterName: string;
  strings: BookStrings;
  when: WhenStrings;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const needsWho = people.length > 1;
  const steps = needsWho
    ? (["day", "when", "who", "confirm"] as const)
    : (["day", "when", "confirm"] as const);

  const [index, setIndex] = useState(0);
  const [day, setDay] = useState<DayOption | null>(null);
  const [time, setTime] = useState<RideTimeOfDay | null>(null);
  const [person, setPerson] = useState<Person | null>(
    needsWho ? null : people[0],
  );
  const [note, setNote] = useState("");

  const step = steps[index];
  const forward = () =>
    setIndex((current) => Math.min(current + 1, steps.length - 1));

  function submit() {
    if (!day || !time || !person) return;

    startTransition(async () => {
      const result = await bookRide({
        passengerId: person.id,
        preferredDate: day.iso,
        timeOfDay: time,
        note: note.trim() || undefined,
      });

      if (result.ok) {
        haptics.success();
        toast.success(strings.sent);
        router.push("/passenger/rides");
        return;
      }

      haptics.error();
      toast.error(strings.errors[result.error]);
    });
  }

  return (
    <>
      <header className="flex items-center gap-3">
        {index > 0 ? (
          <button
            type="button"
            onClick={() => setIndex(index - 1)}
            aria-label={strings.back}
            className="-ml-2 flex size-12 items-center justify-center rounded-full transition-colors hover:bg-grey-tint motion-reduce:transition-none"
          >
            <ArrowLeft
              aria-hidden
              className="size-5"
            />
          </button>
        ) : (
          <Link
            href="/passenger"
            aria-label={strings.close}
            className="-ml-2 flex size-12 items-center justify-center rounded-full transition-colors hover:bg-grey-tint motion-reduce:transition-none"
          >
            <X
              aria-hidden
              className="size-5"
            />
          </Link>
        )}
        <span className="text-2sm text-ink-soft">
          {fill(strings.step, { current: index + 1, total: steps.length })}
        </span>
      </header>

      <ol
        aria-hidden
        className="mt-3 flex gap-1.5"
      >
        {steps.map((name, position) => (
          <li
            key={name}
            className={cn(
              "h-1 flex-1 rounded-full",
              position <= index ? "bg-mint" : "bg-canvas-deeper",
            )}
          />
        ))}
      </ol>

      {step === "day" ? (
        <Section
          title={strings.dayTitle}
          hint={strings.dayHint}
        >
          {days.map((option) => (
            <Choice
              key={option.iso}
              label={option.label}
              badge={option.badge}
              selected={day?.iso === option.iso}
              onSelect={() => {
                setDay(option);
                forward();
              }}
            />
          ))}
        </Section>
      ) : null}

      {step === "when" ? (
        <Section title={strings.whenTitle}>
          {TIMES.map((value) => (
            <Choice
              key={value}
              label={whenLabels[value]}
              selected={time === value}
              onSelect={() => {
                setTime(value);
                forward();
              }}
            />
          ))}
        </Section>
      ) : null}

      {step === "who" ? (
        <Section
          title={strings.whoTitle}
          hint={strings.whoHint}
        >
          {people.map((candidate) => (
            <Choice
              key={candidate.id}
              label={candidate.name}
              selected={person?.id === candidate.id}
              onSelect={() => {
                setPerson(candidate);
                forward();
              }}
            />
          ))}
        </Section>
      ) : null}

      {step === "confirm" ? (
        <Section title={strings.confirmTitle}>
          <dl className="divide-y divide-line rounded-(--r-card) border border-line">
            <Row
              label={strings.confirmWho}
              value={person?.name ?? ""}
            />
            <Row
              label={strings.confirmDay}
              value={day?.label ?? ""}
            />
            <Row
              label={strings.confirmWhen}
              value={time ? whenLabels[time] : ""}
            />
            {chapterName ? (
              <Row
                label={strings.confirmChapter}
                value={chapterName}
              />
            ) : null}
          </dl>

          <div className="mt-2">
            <label
              htmlFor="ride-note"
              className="block text-sm text-ink-soft"
            >
              {strings.noteLabel}
            </label>
            <Textarea
              id="ride-note"
              value={note}
              maxLength={500}
              onChange={(event) => setNote(event.target.value)}
              placeholder={strings.notePlaceholder}
              className="mt-2 min-h-24 text-base"
            />
          </div>

          <Button
            type="button"
            disabled={pending}
            onClick={submit}
            className="min-h-16 w-full rounded-(--r-tile) bg-red text-lg font-bold text-white hover:bg-red-hover"
          >
            {pending ? strings.sending : strings.submit}
          </Button>

          <p className="text-center text-2sm text-ink-soft">
            {strings.pending}
          </p>
        </Section>
      ) : null}
    </>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 flex flex-col gap-3">
      <h1 className="text-2xl tracking-tight">{title}</h1>
      {hint ? <p className="-mt-1 text-sm text-ink-soft">{hint}</p> : null}
      {children}
    </section>
  );
}

function Choice({
  label,
  badge,
  selected,
  onSelect,
}: {
  label: string;
  badge?: string | null;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex min-h-16 w-full items-center gap-3 rounded-(--r-card) border px-5 py-3 text-left transition-colors hover:bg-mint-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none",
        selected ? "border-mint-deep bg-mint-tint" : "border-line",
      )}
    >
      <span className="min-w-0 flex-1">{label}</span>
      {badge ? (
        <span className="shrink-0 rounded-full bg-canvas-deeper px-3 py-1 text-2sm">
          {badge}
        </span>
      ) : null}
      <Check
        aria-hidden
        className={cn(
          "size-5 shrink-0",
          selected ? "opacity-100" : "opacity-0",
        )}
      />
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3">
      <dt className="text-2sm text-ink-soft">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
