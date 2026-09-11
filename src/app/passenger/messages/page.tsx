import { Suspense } from "react";
import { MessageCircle } from "lucide-react";
import { requirePerspective } from "@/lib/auth-guards";
import { getDictionary } from "@/lib/i18n";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

export default function PassengerMessagesPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pt-5 pb-6">
      <Suspense fallback={<MessagesSkeleton />}>
        <Messages />
      </Suspense>
    </main>
  );
}

function MessagesSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-9 w-44" />
      <Skeleton className="h-48 w-full rounded-(--r-card)" />
    </div>
  );
}

/**
 * The tab is here before the feature is, on purpose: the nav's four
 * destinations are what someone learns in the first minute, and a tab that
 * appears later moves everything they had just learned. It says plainly that
 * nothing is waiting, and how the chapter reaches them meanwhile.
 */
async function Messages() {
  await requirePerspective("passenger");
  const { messages } = (await getDictionary()).passenger;

  return (
    <>
      <h1 className="text-3xl tracking-tight">{messages.title}</h1>
      <Empty className="mt-8 rounded-(--r-card) border border-line">
        <EmptyHeader>
          <EmptyMedia
            variant="icon"
            className="bg-mint-tint text-ink"
          >
            <MessageCircle aria-hidden />
          </EmptyMedia>
          <EmptyTitle>{messages.empty}</EmptyTitle>
          <EmptyDescription className="text-ink-soft">
            {messages.emptyBody}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </>
  );
}
