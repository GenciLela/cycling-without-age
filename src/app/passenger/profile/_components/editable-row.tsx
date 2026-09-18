"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { fill } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type EditableRowStrings = {
  save: string;
  saving: string;
  cancel: string;
  changeAria: string;
};

/**
 * One line of the profile. Closed it reads like a fact; open it becomes the
 * field that holds that fact, in place — no second screen, and the rest of the
 * page stays where it was.
 *
 * The input arrives as `children`, so this component knows nothing about dates
 * or genders: the panel above owns the field kinds, this owns the behaviour.
 */
export function EditableRow({
  label,
  value,
  open,
  pending,
  canSave,
  onOpen,
  onCancel,
  onSave,
  strings,
  children,
}: {
  label: string;
  value: string;
  open: boolean;
  pending: boolean;
  canSave: boolean;
  onOpen: () => void;
  onCancel: () => void;
  onSave: () => void;
  strings: EditableRowStrings;
  children: ReactNode;
}) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label={fill(strings.changeAria, { field: label })}
        className="flex min-h-14 w-full flex-wrap items-baseline gap-2 px-5 py-3 text-left transition-colors hover:bg-mint-tint focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none"
      >
        <span className="flex-1 text-2sm text-ink-soft">{label}</span>
        <span className="font-medium">{value}</span>
        <ChevronRight
          aria-hidden
          className="size-5 shrink-0 self-center text-ink-soft"
        />
      </button>
    );
  }

  return (
    <div className="bg-canvas-deep px-5 py-4">
      <p className="text-2sm text-ink-soft">{label}</p>
      <div className="mt-2">{children}</div>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          disabled={!canSave || pending}
          onClick={onSave}
          className="min-h-12 flex-1 rounded-full bg-red text-base font-medium text-white hover:bg-red-hover"
        >
          {pending ? strings.saving : strings.save}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
          className="min-h-12 rounded-full border-line px-5 text-base"
        >
          {strings.cancel}
        </Button>
      </div>
    </div>
  );
}
