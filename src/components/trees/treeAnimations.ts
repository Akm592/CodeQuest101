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
    boxShadow: "0px 0px 8px rgba(0,0,0,0.3)",
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
