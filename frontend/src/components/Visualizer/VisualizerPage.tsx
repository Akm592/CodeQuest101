// A minimal shell for visualizers that have not moved onto VisualizerLayout.
//
// The ten bespoke pages each rolled their own `min-h-screen w-screen` root and
// their own page title, and none of them offered a way back. Wrapping them gives
// identical chrome and a working exit without touching their internals — which
// matters because several of them (Graph, Heap, NeuralNetwork) measure their own
// container and are easy to break.

import * as React from "react";

import { cn } from "../../lib/utils";
import VisualizerHeader from "./VisualizerHeader";

export interface VisualizerPageProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
  /** Short line under the header, for pages that had a subtitle. */
  description?: React.ReactNode;
  className?: string;
  /** Extra controls in the header bar. */
  headerExtra?: React.ReactNode;
}

export const VisualizerPage: React.FC<VisualizerPageProps> = ({
  title,
  onBack,
  children,
  description,
  className,
  headerExtra,
}) => (
  // min-h-dvh rather than min-h-screen: on mobile browsers with a dynamic
  // toolbar, 100vh overflows and pushes controls below the fold.
  <div className="flex min-h-dvh w-full flex-col bg-background text-foreground">
    <VisualizerHeader title={title} onBack={onBack}>
      {headerExtra}
    </VisualizerHeader>

    <main className={cn("mx-auto w-full max-w-7xl flex-1 px-3 py-5 sm:px-6 sm:py-8", className)}>
      {description && (
        <p className="mx-auto mb-6 max-w-3xl text-center text-sm text-muted-foreground sm:text-base">
          {description}
        </p>
      )}
      {children}
    </main>
  </div>
);

export default VisualizerPage;
