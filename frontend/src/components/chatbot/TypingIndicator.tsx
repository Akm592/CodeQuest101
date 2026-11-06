import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

/**
 * @param slow  No reply has started after several seconds: most likely the
 *              free-tier backend is waking from sleep, so say so rather than
 *              leaving the dots to look broken.
 */
const TypingIndicator = ({ slow = false }: { slow?: boolean }) => {
  const dotVariants = {
    initial: { y: 0, opacity: 0.4 },
    animate: { y: -3, opacity: 1 },
  };

  const dotTransition = (delay: number) => ({
    duration: 0.6,
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: "easeInOut",
    delay,
  });

  return (
    // Laid out like an answer (avatar, then content) so the reply appears in
    // the place the dots were.
    <motion.div
      className="mt-8 flex items-center gap-3"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      role="status"
      aria-label="The tutor is answering"
    >
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-primary/25 bg-primary/10 text-primary">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
      <div className="flex h-7 items-center gap-1.5">
        {[0, 0.15, 0.3].map((delay) => (
          <motion.span
            key={delay}
            className="h-1.5 w-1.5 rounded-full bg-primary"
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={dotTransition(delay)}
          />
        ))}
      </div>
      {slow && (
        <p className="text-xs leading-snug text-muted-foreground">
          Waking up the server. The first reply after a quiet spell can take up to a minute.
        </p>
      )}
    </motion.div>
  );
};

export default TypingIndicator;
