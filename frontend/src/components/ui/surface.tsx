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
      // The translucent variants are the glass material in index.css, so a
      // Surface and a hand-placed .glass element can never drift apart.
      /** Page-level chrome: headers, sidebars, footers. */
      panel: "glass-strong shadow-none",
      /** Content containers: feature cards, forms, explanation blocks. */
      card: "glass",
      /** The scrim behind a modal. */
      scrim: "bg-black/65 backdrop-blur-sm",
      /** The modal itself. */
      overlay: "glass-strong",
      /** Small inline badges and status pills. */
      chip: "glass-pill",
      /** Recessed area a canvas or code block sits in. */
      well: "bg-black/30 border border-white/[0.06] shadow-[inset_0_1px_2px_rgb(0_0_0/0.4)]",
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
      true: "glass-hover",
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
