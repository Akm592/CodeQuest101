// src/components/chatbot/MessageBubble.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import AlgorithmVisualizer from "../Visualizer/AlgorithmVisualizer";
import VisualizationModal from "../Visualizer/VisualizationModal";

interface MessageBubbleProps {
  message: {
    id: string;
    sender: "user" | "bot";
    text: string;
    timestamp: string;
    isVisualization?: boolean;
    visualizationData?: any;
  };
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [showModal, setShowModal] = useState(false);
  const isUserMessage = message.sender === "user";
  const bubbleClassName = isUserMessage
    ? "bg-blue-500 text-white ml-auto rounded-bl-none"
    : "bg-gray-300 text-gray-800 rounded-br-none";
  const containerClassName = isUserMessage ? "items-end" : "items-start";

  // Custom markdown components
  const components = {
    code: ({ inline, className, children }: any) => (
      <code
        className={
          inline
            ? "bg-opacity-20 px-1 py-0.5 rounded"
            : "block p-3 rounded-lg overflow-x-auto"
        }
      >
        {children}
      </code>
    ),
  };

  return (
    <>
      <motion.div
        className={`flex flex-col ${containerClassName} max-w-2xl`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className={`p-3 ${bubbleClassName} rounded-xl mb-1 cursor-pointer`}
          onClick={() => {
            if (message.isVisualization && message.visualizationData) {
              setShowModal(true);
            }
          }}
        >
          {message.isVisualization && message.visualizationData ? (
            // Optionally, you can show a smaller preview
            <AlgorithmVisualizer
              visualizationData={message.visualizationData}
            />
          ) : (
            <ReactMarkdown components={components}>
              {message.text}
            </ReactMarkdown>
          )}
        </div>
        <span className="text-gray-500 text-xs self-end">
          {message.timestamp}
        </span>
      </motion.div>

      {showModal && message.isVisualization && message.visualizationData && (
        <VisualizationModal
          visualizationData={message.visualizationData}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default MessageBubble;
