import type { CommandContributor } from "@/lib/commands";

export const commands: CommandContributor = (dict) => [
  {
    id: "rides",
    group: "navigate",
    label: dict.admin.nav.rides,
    icon: "rides",
    run: { kind: "navigate", href: "/admin/rides" },
    keywords: ["trips", "bookings", "schedule", "requests"],
  },
];
