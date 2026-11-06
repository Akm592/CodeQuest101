// Theme colours for the ML pages' SVG, from the same tokens as the rest of the site.

export const C = {
  fg: "hsl(var(--foreground))",
  muted: "hsl(var(--muted-foreground))",
  grid: "hsl(var(--border))",
  card: "hsl(var(--muted))",
  teal: "hsl(var(--viz-current))",
  violet: "hsl(var(--viz-visited))",
  amber: "hsl(var(--viz-compare))",
  red: "hsl(var(--viz-swap))",
  /** Red light enough for text; viz-swap is for fills and lines. */
  redText: "hsl(var(--destructive-bright))",
  green: "hsl(var(--viz-found))",
  sky: "hsl(var(--viz-pointer))",
  idle: "hsl(var(--viz-idle))",
};

/** One colour per cluster, in a fixed order. */
export const CLUSTER = [C.teal, C.violet, C.amber, C.sky, C.green, C.red];
