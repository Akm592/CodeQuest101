// The app's surface primitives.
//
// Before this, nine semantic surfaces were spelled ~35 different ways: five
// blur radii, three border alphas, five background alphas and six corner radii,
// with no shared source. Four spellings of the same modal scrim; three
// incompatible "floating header" bars; the same status chip written with
// `border-white/10`, `border-white/5` and no border at all.
//
// Everything translucent in the app should come from here. If a new surface is
// needed, add a variant rather than a new class string at the call site.

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../lib/utils";

export const surfaceVariants = cva("", {
  variants: {
    variant: {
      /** Page-level chrome: headers, sidebars, footers. */
      panel: "bg-card/80 backdrop-blur-xl border border-white/10",
      /** Content containers: feature cards, forms, explanation blocks. */
      card: "bg-white/[0.04] backdrop-blur-xl border border-white/10",
      /** The scrim behind a modal. */
      scrim: "bg-black/65 backdrop-blur-sm",
      /** The modal itself. */
      overlay: "bg-popover/95 backdrop-blur-xl border border-white/[0.16] shadow-2xl",
      /** Small inline badges and status pills. */
      chip: "bg-white/5 backdrop-blur-md border border-white/10",
      /** Recessed area a canvas or code block sits in. */
      well: "bg-black/40 border border-white/5",
    },
    radius: {
      none: "rounded-none",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      full: "rounded-full",
    },
    interactive: {
      true: "transition-colors duration-200 hover:bg-white/[0.07] hover:border-primary/30",
      false: "",
    },
  },
  defaultVariants: {
    variant: "card",
    radius: "xl",
    interactive: false,
  },
});

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {
  /** Render as a different element, e.g. "header", "aside", "footer". */
  as?: React.ElementType;
}

/** A translucent surface. Use instead of hand-written blur/border/bg classes. */
export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, variant, radius, interactive, as: Component = "div", ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(surfaceVariants({ variant, radius, interactive }), className)}
      {...props}
    />
  ),
);
Surface.displayName = "Surface";
