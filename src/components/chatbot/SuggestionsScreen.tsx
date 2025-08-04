
import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Lightbulb } from "lucide-react";


const SuggestionsScreen = React.memo(({ onSuggestionClick }: { onSuggestionClick: (suggestion: string) => void }) => {
  const suggestions = [
    "Explain quicksort with a step-by-step example.",
    "Visualize a BFS traversal on a sample graph.",
    "Generate a linked list visualization for [1, 2, 3, 4].",
    "Explain the two-pointer technique with an example.",
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-800 dark:text-gray-100 p-4 sm:p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="text-center mb-8 sm:mb-10"
      >
        <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-blue-500 dark:text-blue-400 mb-4" />
        <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400">
          Welcome to AI Assistant
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">How can I help you today?</p>
      </motion.div>

      <div className="w-full max-w-3xl">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300 mb-5 flex items-center justify-center gap-2">
          <Lightbulb className="w-5 h-5" />
          <span>Try these suggestions:</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="bg-white/30 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10
                         text-gray-800 dark:text-gray-200 rounded-xl p-4 sm:p-5 text-left shadow-lg hover:shadow-xl
                         hover:bg-white/40 dark:hover:bg-black/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              onClick={() => onSuggestionClick(suggestion)}
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
});


export default SuggestionsScreen;