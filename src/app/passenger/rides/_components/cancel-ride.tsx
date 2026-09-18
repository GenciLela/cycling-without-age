"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cancelRideRequest } from "../../actions";

export type CancelRideStrings = {
  cancel: string;
  cancelTitle: string;
  cancelBody: string;
  cancelConfirm: string;
  cancelKeep: string;
  cancelled: string;
  cancelFailed: string;
};

export function CancelRide({
  id,
  day,
  strings,
}: {
  id: string;
  day: string;
  strings: CancelRideStrings;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await cancelRideRequest(id);
      setOpen(false);

      if (result.ok) {
        haptics.success();
        toast.success(strings.cancelled);
        // The ride's own page is where cancelling happens, and a cancelled ride
        // is no longer a ride to look at. The list is.
        router.push("/passenger/rides");
      } else {
        haptics.error();
        toast.error(strings.cancelFailed);
      }
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={setOpen}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="min-h-12 w-full rounded-full border-line text-base"
        >
          {strings.cancel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {fill(strings.cancelTitle, { date: day })}
          </AlertDialogTitle>
          <AlertDialogDescription>{strings.cancelBody}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-12">
            {strings.cancelKeep}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              confirm();
            }}
            className="min-h-12 bg-red text-white hover:bg-red-hover"
          >
            {strings.cancelConfirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
