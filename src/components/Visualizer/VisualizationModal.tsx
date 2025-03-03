// src/components/Modal/VisualizationModal.tsx
import React from "react";
import AlgorithmVisualizer from "../Visualizer/AlgorithmVisualizer";

interface VisualizationModalProps {
  visualizationData: any;
  onClose: () => void;
}

const VisualizationModal: React.FC<VisualizationModalProps> = ({ visualizationData, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-4 rounded-lg relative max-w-4xl w-full">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-3xl text-gray-600 hover:text-gray-800"
        >
          &times;
        </button>
        <div className="p-4">
          <AlgorithmVisualizer visualizationData={visualizationData} />
        </div>
      </div>
    </div>
  );
};

export default VisualizationModal;
