import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { Shield, UserRound } from "lucide-react";
import { chapters } from "@/features/chapters";
import { passengers } from "@/features/passengers";
import { profile } from "@/features/profile";
import { availablePerspectives } from "@/lib/access";
import { requirePerspective } from "@/lib/auth-guards";
import { avatarSeed, avatarSvg } from "@/lib/avatar";
import { formatDate, resolveLocale } from "@/lib/format";
import { getDictionary, getLocale } from "@/lib/i18n";
import { isPhoneTempEmail } from "@/lib/identity";
import { PERSPECTIVE_HOME } from "@/lib/redirects";
import { fill } from "@/lib/utils";
import { AccountDialog } from "@/components/account-dialog";
import { LanguagePicker } from "@/components/language-picker";
import { PersonAvatar } from "@/components/person-avatar";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function PassengerProfilePage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pt-5 pb-6">
      <Suspense fallback={<ProfileSkeleton />}>
        <Profile />
      </Suspense>
    </main>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="size-20 rounded-full" />
      <Skeleton className="h-8 w-52" />
      <Skeleton className="h-32 w-full rounded-(--r-card)" />
      <Skeleton className="h-32 w-full rounded-(--r-card)" />
    </div>
  );
}

async function Profile() {
  const session = await requirePerspective("passenger");
  const [people, account, dict, head, language] = await Promise.all([
    passengers.listPassengersManagedBy(session.user.id),
    profile.getProfile(session.user.id),
    getDictionary(),
    headers(),
    getLocale(),
  ]);

  const notation = resolveLocale(head.get("accept-language"));
  const strings = dict.passenger.profile;

  const own = people.find((person) => person.userId === session.user.id);
  const managed = people.filter((person) => person.id !== own?.id);
  const chapter = people[0]
    ? await chapters.getChapter(people[0].chapterId)
    : null;

  // A phone sign-up carries a synthetic address; showing it would read as an
  // email the person does not have.
  const contact =
    (isPhoneTempEmail(session.user.email) ? null : session.user.email) ??
    account?.phoneNumber ??
    null;
  const elsewhere = availablePerspectives(session.access).filter(
    (perspective) => perspective !== "passenger",
  );

  return (
    <>
      <header className="flex flex-col items-center gap-3 text-center">
        <PersonAvatar
          svg={avatarSvg(avatarSeed(session.user.email), true)}
          className="size-20"
        />
        <div>
          <h1 className="text-2xl tracking-tight">{session.user.name}</h1>
          {contact ? (
            <p className="mt-1 text-sm text-ink-soft">{contact}</p>
          ) : null}
        </div>
      </header>

      {own ? (
        <Panel title={strings.rider}>
          <RiderLink
            href={`/passenger/profile/${own.id}`}
            label={`${own.firstName} ${own.lastName}`}
            value={formatDate(own.birthDate, notation)}
            aria={fill(strings.editAria, { name: own.firstName })}
            action={strings.edit}
          />
        </Panel>
      ) : null}

      {managed.length > 0 ? (
        <Panel title={strings.managed}>
          {managed.map((person) => (
            <RiderLink
              key={person.id}
              href={`/passenger/profile/${person.id}`}
              label={`${person.firstName} ${person.lastName}`}
              value={formatDate(person.birthDate, notation)}
              aria={fill(strings.editAria, { name: person.firstName })}
              action={strings.edit}
            />
          ))}
        </Panel>
      ) : null}

      <Panel title={strings.chapter}>
        <Row
          label={chapter?.name ?? strings.noChapter}
          value={chapter?.careHomeName ?? chapter?.city ?? ""}
        />
      </Panel>

      <section className="mt-6 flex flex-col gap-3">
        <h2 className="text-2sm font-semibold tracking-wide text-ink-soft uppercase">
          {strings.language}
        </h2>
        <LanguagePicker
          locale={language}
          label={dict.common.language}
          className="h-12 w-full justify-start px-5 text-base"
        />
      </section>

      <section className="mt-6 flex flex-col gap-3">
        <h2 className="text-2sm font-semibold tracking-wide text-ink-soft uppercase">
          {strings.account}
        </h2>
        <AccountDialog
          strings={dict.account}
          locale={notation}
          profile={{
            name: session.user.name,
            email: session.user.email,
            avatar: avatarSvg(avatarSeed(session.user.email), true),
          }}
          trigger={
            <Button
              variant="outline"
              className="min-h-12 w-full justify-start gap-3 rounded-full border-line px-5 text-base"
            >
              <UserRound
                aria-hidden
                className="size-5"
              />
              {strings.accountAction}
            </Button>
          }
        />
      </section>

      {elsewhere.length > 0 ? (
        <section className="mt-6 flex flex-col gap-3">
          <h2 className="text-2sm font-semibold tracking-wide text-ink-soft uppercase">
            {strings.perspective}
          </h2>
          {elsewhere.map((perspective) => (
            <Button
              key={perspective}
              asChild
              variant="outline"
              className="min-h-12 w-full justify-start gap-3 rounded-full border-line px-5 text-base"
            >
              <Link href={PERSPECTIVE_HOME[perspective]}>
                <Shield
                  aria-hidden
                  className="size-5"
                />
                {perspective === "admin"
                  ? strings.viewAsAdmin
                  : strings.viewAsPilot}
              </Link>
            </Button>
          ))}
        </section>
      ) : null}

      <footer className="mt-10 border-t border-line pt-6">
        <SignOutButton label={dict.common.signOut} />
      </footer>
    </>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="text-2sm font-semibold tracking-wide text-ink-soft uppercase">
        {title}
      </h2>
      <dl className="mt-3 divide-y divide-line rounded-(--r-card) border border-line">
        {children}
      </dl>
    </section>
  );
}

function RiderLink({
  href,
  label,
  value,
  aria,
  action,
}: {
  href: string;
  label: string;
  value: string;
  aria: string;
  action: string;
}) {
  return (
    <Link
      href={href}
      aria-label={aria}
      className="flex min-h-14 flex-wrap items-baseline justify-between gap-2 px-5 py-3 transition-colors hover:bg-mint-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none"
    >
      <span className="font-medium">{label}</span>
      <span className="flex items-baseline gap-3">
        <span className="text-2sm text-ink-soft">{value}</span>
        <span className="text-2sm font-medium underline underline-offset-4">
          {action}
        </span>
      </span>
    </Link>
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
