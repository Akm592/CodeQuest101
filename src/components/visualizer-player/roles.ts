// Colours and names for highlight roles, shared by the renderers and the key.

import type { HighlightRole } from "../../lib/scene/types";

// When a step marks one element with several roles, the strongest wins.
export const PRIORITY: HighlightRole[] = ["found", "swap", "compare", "current", "window", "visited"];

export const ROLE_CLASSES: Record<HighlightRole | "none", string> = {
  found: "border-viz-found bg-viz-found/25",
  swap: "border-viz-swap bg-viz-swap/25",
  compare: "border-viz-compare bg-viz-compare/20",
  current: "border-viz-current bg-viz-current/20",
  window: "border-viz-pointer/70 bg-viz-pointer/15",
  visited: "border-viz-visited/60 bg-viz-visited/10",
  none: "border-white/10 bg-white/[0.04]",
};

export const ROLE_LABELS: Record<HighlightRole, string> = {
  current: "Current",
  compare: "Compared",
  swap: "Swapped / removed",
  found: "Found / answer",
  visited: "Done",
  window: "In range",
};
