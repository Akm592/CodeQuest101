import { motion } from "framer-motion";

const TypingIndicator = () => {
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: -5 },
  };

  const dotTransition = (delay: number) => ({
    duration: 0.4,
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: "easeInOut",
    delay,
  });

  return (
    <motion.div
      className="flex items-end max-w-lg lg:max-w-xl xl:max-w-2xl mr-auto mb-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border border-white/10 dark:border-white/5
                      text-gray-800 dark:text-gray-200 rounded-2xl px-4 py-3 rounded-bl-none shadow-md">
        <div className="flex space-x-1.5 items-center h-4">
          <motion.span
            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={dotTransition(0)}
          />
          <motion.span
            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={dotTransition(0.15)}
          />
          <motion.span
            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
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