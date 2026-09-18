import { Suspense } from "react";
import { headers } from "next/headers";
import { rides, rideRequestStatus } from "@/features/rides";
import {
  formatDate,
  formatWeekdayDateLong,
  resolveLocale,
  toIsoDateUtc,
} from "@/lib/format";
import { getDictionary } from "@/lib/i18n";
import { isPhoneTempEmail } from "@/lib/identity";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import {
  AdminPageFallback,
  AdminPageHeader,
  AdminPageShell,
} from "../_components/admin-page";
import { ICONS } from "../_components/icons";
import { readActiveScope } from "../active-scope";
import { RidesTable, type AdminRideRow } from "./_components/rides-table";

type AdminSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function RidesPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  return (
    <AdminPageShell>
      <Suspense fallback={<AdminPageFallback />}>
        <Rides searchParams={searchParams} />
      </Suspense>
    </AdminPageShell>
  );
}

async function Rides({ searchParams }: { searchParams: AdminSearchParams }) {
  const { chapters, chapterIds } = await readActiveScope(searchParams);

  const [list, dict, head] = await Promise.all([
    rides.listRequestsOfChapters(chapterIds),
    getDictionary(),
    headers(),
  ]);

  const notation = resolveLocale(head.get("accept-language"));
  const today = toIsoDateUtc(new Date());
  const { columns, empty, decide } = dict.admin.rides;

  const rows: AdminRideRow[] = list.map((request) => ({
    id: request.id,
    rider: `${request.passenger.firstName} ${request.passenger.lastName}`,
    day: formatWeekdayDateLong(request.preferredDate, notation),
    dayIso: toIsoDateUtc(request.preferredDate),
    when: dict.passenger.when[request.timeOfDay],
    status: request.status,
    statusLabel: dict.passenger.status[request.status],
    chapterName: request.chapter.name,
    asked: formatDate(request.createdAt, notation),
    askedIso: request.createdAt.toISOString(),
    contact:
      request.requestedBy.email && !isPhoneTempEmail(request.requestedBy.email)
        ? request.requestedBy.email
        : (request.requestedBy.phoneNumber ?? null),
    canDecide: request.status === "requested",
    // Only after the day has passed: "done" is a fact, and offering it on a
    // ride that has not happened invites a chapter to tidy its list forward.
    canComplete:
      request.status === "confirmed" &&
      toIsoDateUtc(request.preferredDate) < today,
  }));

  const RidesIcon = ICONS.rides;

  return (
    <>
      <AdminPageHeader title={dict.admin.pages.rides.title} />

      {rows.length > 0 ? (
        <RidesTable
          rows={rows}
          showChapter={chapters.length > 1}
          labels={columns}
          statuses={rideRequestStatus.options.map((status) => ({
            value: status,
            label: dict.passenger.status[status],
          }))}
          table={dict.admin.table}
          decide={decide}
        />
      ) : (
        <Empty className="rounded-2xl border border-line">
          <EmptyHeader>
            <EmptyMedia
              variant="icon"
              className="bg-mint-tint text-ink"
            >
              <RidesIcon aria-hidden />
            </EmptyMedia>
            <EmptyDescription className="text-ink-soft">
              {empty}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </>
  );
}
