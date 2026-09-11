import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RideView } from "./ride-view";

/**
 * No red here. A declined or cancelled ride is a disappointment, not an alarm,
 * and red belongs to the one button that books the next one.
 */
const TONE: Record<RideView["status"], string> = {
  requested: "bg-canvas-deeper text-ink",
  confirmed: "bg-mint text-ink",
  declined: "bg-grey-tint text-ink-soft",
  cancelled: "bg-grey-tint text-ink-soft",
  completed: "bg-mint-tint text-ink",
};

export function RideStatus({
  status,
  label,
  className,
}: {
  status: RideView["status"];
  label: string;
  className?: string;
}) {
  return (
    <Badge className={cn("px-3 py-1 text-2sm", TONE[status], className)}>
      {label}
    </Badge>
  );
}
