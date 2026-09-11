"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  type DataTableFilter,
  type DataTableStrings,
} from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AdminRideRow = {
  id: string;
  rider: string;
  day: string;
  dayIso: string;
  when: string;
  status: string;
  statusLabel: string;
  chapterName: string;
  asked: string;
  askedIso: string;
  contact: string | null;
};

const TONE: Record<string, string> = {
  requested: "bg-canvas-deeper text-ink",
  confirmed: "bg-mint text-ink",
  declined: "bg-grey-tint text-ink-soft",
  cancelled: "bg-grey-tint text-ink-soft",
  completed: "bg-mint-tint text-ink",
};

export function RidesTable({
  rows,
  showChapter,
  labels,
  statuses,
  table,
}: {
  rows: AdminRideRow[];
  showChapter: boolean;
  labels: {
    rider: string;
    day: string;
    when: string;
    status: string;
    chapter: string;
    asked: string;
    contact: string;
  };
  statuses: { value: string; label: string }[];
  table: DataTableStrings;
}) {
  const columns: ColumnDef<AdminRideRow, unknown>[] = [
    {
      id: "rider",
      accessorFn: (row) => row.rider,
      enableHiding: false,
      enableSorting: true,
      meta: {
        label: labels.rider,
        searchValue: (row) => `${row.rider} ${row.contact ?? ""}`,
      },
      cell: ({ row }) => (
        <div className="grid">
          <span className="font-medium">{row.original.rider}</span>
          {row.original.contact ? (
            <span className="text-xs text-ink-soft">
              {row.original.contact}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      id: "day",
      accessorFn: (row) => row.day,
      enableSorting: true,
      sortingFn: (a, b) => a.original.dayIso.localeCompare(b.original.dayIso),
      meta: { label: labels.day },
      cell: ({ row }) => <span>{row.original.day}</span>,
    },
    {
      id: "when",
      accessorFn: (row) => row.when,
      meta: { label: labels.when },
      cell: ({ row }) => (
        <span className="text-ink-soft">{row.original.when}</span>
      ),
    },
    {
      id: "status",
      accessorFn: (row) => row.status,
      meta: { label: labels.status },
      cell: ({ row }) => (
        <Badge className={cn("px-3 py-1 text-2sm", TONE[row.original.status])}>
          {row.original.statusLabel}
        </Badge>
      ),
    },
    {
      id: "chapter",
      accessorFn: (row) => row.chapterName,
      enableSorting: true,
      meta: { label: labels.chapter },
      cell: ({ row }) => (
        <span className="text-ink-soft">{row.original.chapterName}</span>
      ),
    },
    {
      id: "asked",
      accessorFn: (row) => row.asked,
      enableSorting: true,
      sortingFn: (a, b) =>
        a.original.askedIso.localeCompare(b.original.askedIso),
      meta: { label: labels.asked },
      cell: ({ row }) => (
        <span className="text-ink-soft">{row.original.asked}</span>
      ),
    },
  ];

  const filters: DataTableFilter[] = [
    { columnId: "status", label: labels.status, options: statuses },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      strings={table}
      filters={filters}
      getRowId={(row) => row.id}
      initialHidden={showChapter ? [] : ["chapter"]}
    />
  );
}
