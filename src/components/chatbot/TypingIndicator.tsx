import { motion } from "framer-motion";

const TypingIndicator = () => {
  const dotVariants = {
    initial: { y: 0, opacity: 0.4 },
    animate: { y: -6, opacity: 1 },
  };

  const dotTransition = (delay: number) => ({
    duration: 0.6,
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: "easeInOut",
    delay,
  });

  return (
    <motion.div
      className="flex items-end gap-3 mb-6 px-2 sm:px-0"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      {/* Bot Avatar */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 dark:border-white/10 shadow-lg bg-white dark:bg-[#1a1f2e] text-teal-600 dark:text-teal-400">
        <div className="w-2 h-2 bg-teal-500 dark:bg-teal-400 rounded-full animate-pulse" />
      </div>

      <div className="bg-white/90 dark:bg-[#151922]/90 backdrop-blur-lg border border-gray-200 dark:border-white/10
                      text-gray-800 dark:text-gray-200 rounded-3xl rounded-bl-none px-5 py-4 shadow-lg min-w-[80px] flex items-center justify-center">
        <div className="flex space-x-1.5 items-center h-4">
          <motion.span
            className="w-2 h-2 bg-teal-500 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]"
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={dotTransition(0)}
          />
          <motion.span
            className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={dotTransition(0.15)}
          />
          <motion.span
            className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={dotTransition(0.3)}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default TypingIndicator;
