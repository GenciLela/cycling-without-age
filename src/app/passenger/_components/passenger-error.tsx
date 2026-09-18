"use client";

import { Component, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

export type PassengerErrorStrings = {
  title: string;
  body: string;
  retry: string;
};

/**
 * A route-level `error.tsx` would be simpler, but it is a Client Component and
 * the dictionary is server-only — an error page in the wrong language is its
 * own small failure, for the one perspective whose readers are least able to
 * work around it.
 *
 * So the screen arrives as a prop instead: the layout streams it in the
 * recipient's language, already rendered, and this boundary only decides when
 * to show it. `children` is never rendered twice and never remounts, which a
 * `<Suspense fallback={children}>` around an awaited dictionary would do.
 */
export class PassengerError extends Component<
  { screen: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[passenger] render failed", error);
  }

  render() {
    return this.state.failed ? this.props.screen : this.props.children;
  }
}

/** The screen itself. Reloading rather than a `reset()`: whatever failed is on
 *  the server, and a fresh request is the only thing that can fix it. */
export function PassengerErrorScreen({
  strings,
}: {
  strings: PassengerErrorStrings;
}) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-5 px-5 py-12 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-mint-tint">
        <TriangleAlert
          aria-hidden
          className="size-7 text-ink"
        />
      </span>
      <h1 className="text-3xl tracking-tight">{strings.title}</h1>
      <p className="text-ink-soft">{strings.body}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="min-h-14 rounded-(--r-tile) bg-red px-6 font-display text-lg font-bold text-white transition-colors hover:bg-red-hover motion-reduce:transition-none"
      >
        {strings.retry}
      </button>
    </main>
  );
}
