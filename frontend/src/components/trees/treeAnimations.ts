// treeAnimations.ts
// **MODIFIED**: Changed boxShadow for highlighted nodes to be visible on dark background
import { Variants } from "framer-motion";

export const nodeVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 25,
      duration: 0.5,
    },
  },
  highlighted: {
    scale: 1.2,
    // Use a light or colored glow for dark backgrounds
    boxShadow: "0px 0px 12px rgba(255, 255, 255, 0.4)", // White glow
    // Or consider a colored glow, e.g., blue: "0px 0px 12px rgba(59, 130, 246, 0.5)",
    transition: { duration: 0.3 },
  },
};

export const linkVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 40,
      duration: 0.6,
    },
  },
};