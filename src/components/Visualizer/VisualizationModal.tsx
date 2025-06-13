// src/components/Modal/VisualizationModal.tsx
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import AlgorithmVisualizer from "../Visualizer/AlgorithmVisualizer";

interface VisualizationModalProps {
  visualizationData: any;
  onClose: () => void;
}

const VisualizationModal: React.FC<VisualizationModalProps> = ({ visualizationData, onClose }) => {
  // Effect to handle Escape key press for closing the modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4"
        onClick={onClose} // Close the modal when clicking on the overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-white/10
                     rounded-2xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] 
                     flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal content
          role="dialog"
          aria-modal="true"
          aria-labelledby="visualization-modal-title"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* Modal Header */}
          <header className="flex items-center justify-between p-4 border-b border-white/10 dark:border-gray-700/50 flex-shrink-0">
            <h2 id="visualization-modal-title" className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Algorithm Visualization
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-200/50 dark:hover:bg-gray-700/50
                         transition-all duration-200 hover:scale-110 active:scale-95
                         focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              aria-label="Close visualization"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          {/* Modal Content */}
          <div className="p-2 sm:p-4 flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-400/50 dark:scrollbar-thumb-gray-600/50">
            <AlgorithmVisualizer visualizationData={visualizationData} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VisualizationModal;