// The header every visualizer route wears.
//
// This exists because none of the 13 visualizer routes had a way back. Ten of
// them accepted an `onBack` prop and threw it away (`{ onBack: _onBack }`), and
// the three that used VisualizerLayout buried "Back to Dashboard" in a sidebar
// that starts collapsed — so the only visible affordance was a chevron pointing
// the wrong way. The browser back button was the real exit on every page.
//
// Extracting the header means the ten bespoke pages get a working exit and the
// same chrome without having to be rewritten onto the shared layout first.

import { ArrowLeft } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";
import { Surface } from "../ui/surface";

export interface VisualizerHeaderProps {
  title: string;
  /** Required, not optional: TypeScript should catch the next route that forgets. */
  onBack: () => void;
  /** Rendered between the title and the status pill. */
  children?: React.ReactNode;
  className?: string;
  /** Extra control on the left, e.g. the layout's sidebar toggle. */
  leading?: React.ReactNode;
}

export const VisualizerHeader: React.FC<VisualizerHeaderProps> = ({
  title,
  onBack,
  children,
  className,
  leading,
}) => (
  <Surface
    as="header"
    variant="panel"
    radius="none"
    className={cn(
      "sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-x-0 border-t-0 px-3 sm:h-16 sm:px-6",
      className,
    )}
  >
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      {leading}
      {/* A labelled button, not an icon alone: this is the primary exit. */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground sm:px-3"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className="h-5 w-px shrink-0 bg-border" aria-hidden="true" />

      <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">{title}</h1>
    </div>

    <div className="flex shrink-0 items-center gap-2">
      {children}
      <Surface
        variant="chip"
        radius="full"
        className="hidden px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary sm:block"
      >
        Interactive
      </Surface>
    </div>
  </Surface>
);

export default VisualizerHeader;
