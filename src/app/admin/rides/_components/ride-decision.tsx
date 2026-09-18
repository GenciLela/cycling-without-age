"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Dictionary } from "@/lib/i18n";
import { haptics } from "@/lib/native/haptics";
import { fill } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  completeRideAction,
  decideRideAction,
  type RideDecisionResult,
} from "../actions";

export type RideDecisionStrings = Dictionary["admin"]["rides"]["decide"];

/**
 * Three verbs, all visible — a decision a chapter owes a waiting passenger does
 * not belong behind a `⋯`. Confirming and completing are one tap because a
 * second admin conversation undoes either; declining is not, so it asks once
 * and offers the passenger a reason while it does.
 */
export function RideDecision({
  id,
  rider,
  day,
  canDecide,
  canComplete,
  strings,
}: {
  id: string;
  rider: string;
  day: string;
  canDecide: boolean;
  canComplete: boolean;
  strings: RideDecisionStrings;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const report = (result: RideDecisionResult, done: string) => {
    if (result.ok) {
      haptics.success();
      toast.success(done);
      return;
    }
    haptics.error();
    toast.error(strings.errors[result.error]);
  };

  if (!canDecide && !canComplete) {
    return <span className="text-2sm text-ink-soft">{strings.answered}</span>;
  }

  return (
    <div className="flex items-center gap-1.25">
      {canDecide ? (
        <>
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () =>
                report(
                  await decideRideAction({ id, decision: "confirmed" }),
                  strings.confirmed,
                ),
              )
            }
            className="h-9 rounded-full bg-mint px-4 text-2sm text-ink hover:bg-mint-deep hover:text-white"
          >
            {strings.confirm}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => setOpen(true)}
            className="h-9 rounded-full border-line px-4 text-2sm"
          >
            {strings.decline}
          </Button>
        </>
      ) : null}

      {canComplete ? (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () =>
              report(await completeRideAction({ id }), strings.completed),
            )
          }
          className="h-9 rounded-full border-line px-4 text-2sm"
        >
          {strings.complete}
        </Button>
      ) : null}

      <AlertDialog
        open={open}
        onOpenChange={setOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {fill(strings.declineTitle, { rider, day })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {strings.declineBody}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div>
            <Label
              htmlFor={`decline-reason-${id}`}
              className="mb-1.5 text-sm font-medium text-ink-soft"
            >
              {strings.reasonLabel}
            </Label>
            <Textarea
              id={`decline-reason-${id}`}
              value={reason}
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
              placeholder={strings.reasonPlaceholder}
              className="min-h-24 text-base"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-12">
              {strings.keep}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                startTransition(async () => {
                  const result = await decideRideAction({
                    id,
                    decision: "declined",
                    declineReason: reason.trim() || undefined,
                  });
                  setOpen(false);
                  report(result, strings.declined);
                });
              }}
              className="min-h-12 bg-red text-white hover:bg-red-hover"
            >
              {strings.declineConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
