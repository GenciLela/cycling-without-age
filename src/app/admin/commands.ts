import { commands as chapterCommands } from "@/features/chapters/commands";
import { commands as membershipCommands } from "@/features/membership/commands";
import { commands as passengerCommands } from "@/features/passengers/commands";
import { commands as profileCommands } from "@/features/profile/commands";
import { commands as rideCommands } from "@/features/rides/commands";
import type { AdminScope, Perspective } from "@/lib/access";
import { collectCommands } from "@/lib/commands";
import type {
  CommandContributor,
  CommandEntry,
  IconKey,
  ResolvedCommand,
} from "@/lib/commands";
import type { Dictionary, Locale } from "@/lib/i18n";
import { LOCALE_LABELS, locales } from "@/lib/i18n/locales";
import { PERSPECTIVE_HOME } from "@/lib/redirects";
import { fill } from "@/lib/utils";
import { NAV, type NavItem, type NavKey } from "./nav";
import { scopeChoices } from "./scopes";

export type AdminCommandContext = {
  perspectives: readonly Perspective[];
  locale: Locale;
};

const CONTRIBUTORS: readonly CommandContributor[] = [
  membershipCommands,
  passengerCommands,
  rideCommands,
  chapterCommands,
  profileCommands,
];

/** Search-assist only, never displayed — English regardless of the dictionary. */
const SHELL_KEYWORDS: Partial<Record<NavKey, readonly string[]>> = {
  overview: ["dashboard", "home", "today"],
  rides: ["trips", "bookings", "schedule"],
  bikes: ["bikes", "rickshaw", "trishaw", "service"],
  chat: ["chat", "conversations", "inbox"],
  reports: ["statistics", "numbers", "hours", "export"],
  help: ["support", "guides", "docs", "contact"],
};

const PERSPECTIVE_ICON: Record<Perspective, IconKey> = {
  admin: "admin",
  pilot: "pilot",
  passenger: "passenger",
};

const shellEntry = (dict: Dictionary, item: NavItem): CommandEntry => ({
  id: item.key,
  group: "navigate",
  label: dict.admin.nav[item.key],
  icon: item.icon,
  run: { kind: "navigate", href: item.href },
  keywords: SHELL_KEYWORDS[item.key],
  visible: item.visible,
});

/**
 * Walking `NAV` — rather than concatenating whatever the slices happen to
 * export — is what makes "every destination is in the palette, exactly once,
 * in sidebar order" structural instead of a convention. A slice claims its row
 * by href; the shell fills the rest. Anything a slice contributes that matches
 * no row still comes through (as `rest`), so a typo surfaces in the parity test
 * instead of vanishing.
 */
function staticEntries(dict: Dictionary): CommandEntry[] {
  const contributed = CONTRIBUTORS.flatMap((contribute) => contribute(dict));
  const byHref = new Map(
    contributed.flatMap((entry) =>
      entry.run.kind === "navigate" ? [[entry.run.href, entry] as const] : [],
    ),
  );

  const navigate = NAV.map(
    (item) => byHref.get(item.href) ?? shellEntry(dict, item),
  );
  const rest = contributed.filter((entry) => !navigate.includes(entry));

  return [
    {
      id: "new-ride",
      group: "create",
      label: dict.admin.commands.newRide,
      icon: "rides",
      run: { kind: "navigate", href: "/admin/rides" },
      keywords: ["book", "trip"],
    },
    ...navigate,
    ...rest,
  ];
}

const perspectiveCommands = (
  dict: Dictionary,
  perspectives: readonly Perspective[],
): ResolvedCommand[] =>
  // One hat is not a choice — a switcher offering it is noise.
  perspectives.length < 2
    ? []
    : perspectives.map((perspective) => ({
        id: `perspective:${perspective}`,
        group: "perspective",
        label: {
          admin: dict.admin.commands.viewAsAdmin,
          pilot: dict.admin.commands.viewAsPilot,
          passenger: dict.admin.commands.viewAsPassenger,
        }[perspective],
        icon: PERSPECTIVE_ICON[perspective],
        run: { kind: "navigate", href: PERSPECTIVE_HOME[perspective] },
        keywords: [],
      }));

function scopeCommands(dict: Dictionary, scope: AdminScope): ResolvedCommand[] {
  // Same list the sidebar switcher renders, from the same builder — the two had
  // already drifted on when "All chapters" is on offer. A single choice is not a
  // choice: every pick would be the view they are already looking at.
  const choices = scopeChoices(scope, dict);
  if (choices.length < 2) return [];

  return choices.map(({ arg, label, icon }) => ({
    id: `scope:${arg}`,
    group: "scope",
    label,
    icon,
    run: { kind: "action", id: "scope.set", arg },
    keywords: [],
  }));
}

const accountCommands = (
  dict: Dictionary,
  active: Locale,
): ResolvedCommand[] => [
  ...locales
    .filter((locale) => locale !== active)
    .map((locale) => ({
      id: `locale:${locale}`,
      group: "account" as const,
      label: fill(dict.admin.commands.language, {
        name: LOCALE_LABELS[locale].name,
      }),
      icon: "language" as const,
      run: { kind: "action" as const, id: "locale.set" as const, arg: locale },
      keywords: [],
    })),
  {
    id: "sidebar-toggle",
    group: "account",
    label: dict.admin.commands.toggleSidebar,
    icon: "sidebar",
    run: { kind: "action", id: "sidebar.toggle" },
    shortcut: "⌘B",
    keywords: [],
  },
  {
    id: "sign-out",
    group: "account",
    label: dict.admin.commands.signOut,
    icon: "signOut",
    run: { kind: "action", id: "session.signOut" },
    keywords: [],
  },
];

export function adminCommands(
  dict: Dictionary,
  scope: AdminScope,
  ctx: AdminCommandContext,
): ResolvedCommand[] {
  return [
    ...collectCommands(staticEntries(dict), scope),
    ...perspectiveCommands(dict, ctx.perspectives),
    ...scopeCommands(dict, scope),
    ...accountCommands(dict, ctx.locale),
  ];
}
