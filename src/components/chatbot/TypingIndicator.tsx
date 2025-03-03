// src/components/chatbot/TypingIndicator.tsx

import { motion } from "framer-motion";

const TypingIndicator = () => {
  return (
    <motion.div
      className="flex items-center space-x-2 max-w-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-gray-300 text-gray-800 rounded-xl p-3 rounded-br-none">
        <div className="flex space-x-1">
          <motion.span
            className="w-2 h-2 bg-gray-500 rounded-full"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatType: "loop" }}
          />
          <motion.span
            className="w-2 h-2 bg-gray-500 rounded-full"
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatType: "loop",
              delay: 0.2,
            }}
          />
          <motion.span
            className="w-2 h-2 bg-gray-500 rounded-full"
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatType: "loop",
              delay: 0.4,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default TypingIndicator;
