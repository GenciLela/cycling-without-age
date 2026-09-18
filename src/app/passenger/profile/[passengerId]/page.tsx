import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { passengers } from "@/features/passengers";
import { requirePerspective } from "@/lib/auth-guards";
import { toIsoDateUtc } from "@/lib/format";
import { getDictionary } from "@/lib/i18n";
import { fill } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { RiderForm } from "./_components/rider-form";

export default function RiderPage({
  params,
}: {
  params: Promise<{ passengerId: string }>;
}) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pt-5 pb-6">
      <Suspense fallback={<RiderSkeleton />}>
        <Rider params={params} />
      </Suspense>
    </main>
  );
}

function RiderSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-12 w-32" />
      <Skeleton className="h-10 w-52" />
      <Skeleton className="h-14 w-full rounded-(--r-card)" />
      <Skeleton className="h-14 w-full rounded-(--r-card)" />
      <Skeleton className="h-14 w-full rounded-(--r-card)" />
    </div>
  );
}

async function Rider({ params }: { params: Promise<{ passengerId: string }> }) {
  const session = await requirePerspective("passenger");
  const [{ passengerId }, dict] = await Promise.all([params, getDictionary()]);

  // The authorised set, again: a rider this account does not manage is simply
  // absent, so the page 404s rather than confirming the id exists.
  const people = await passengers.listPassengersManagedBy(session.user.id);
  const person = people.find((candidate) => candidate.id === passengerId);
  if (!person) notFound();

  const strings = dict.passenger.rider;
  const own = person.userId === session.user.id;

  return (
    <>
      <Link
        href="/passenger/profile"
        className="-ml-2 flex min-h-12 w-fit items-center gap-2 rounded-full px-3 text-base text-ink-soft transition-colors hover:bg-grey-tint hover:text-ink motion-reduce:transition-none"
      >
        <ArrowLeft
          aria-hidden
          className="size-5"
        />
        {strings.back}
      </Link>

      <h1 className="mt-5 text-3xl tracking-tight">
        {own
          ? strings.titleOwn
          : fill(strings.titleOther, { name: person.firstName })}
      </h1>
      <p className="mt-2 text-ink-soft">{strings.body}</p>

      <RiderForm
        passengerId={person.id}
        defaults={{
          firstName: person.firstName,
          lastName: person.lastName,
          birthDate: toIsoDateUtc(person.birthDate),
          gender: person.gender,
        }}
        strings={strings}
      />
    </>
  );
}
