import React, { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Highlight from "react-highlight";
import "highlight.js/styles/github.css";
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
    ? "bg-blue-600 text-white ml-auto rounded-xl sm:rounded-bl-none"
    : "bg-gray-200 text-gray-800 rounded-xl sm:rounded-br-none";
  const containerClassName = isUserMessage ? "items-end" : "items-start";

  // Custom CodeBlock component for markdown code rendering
  const CodeBlock = ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    if (inline) {
      return (
        <code className="bg-gray-100 rounded-md px-2 py-1 font-mono text-sm" {...props}>
          {children}
        </code>
      );
    } else {
      return (
        <div className="relative group my-4 rounded-md border border-gray-300">
          <button
            className="absolute top-2 right-2 bg-gray-300 hover:bg-gray-400 text-xs text-gray-800 rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => {
              navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
            }}
          >
            Copy
          </button>
          <div className="p-4">
            <Highlight className={match ? `language-${match[1]}` : ""} {...props}>
              {String(children).replace(/\n$/, "")}
            </Highlight>
          </div>
        </div>
      );
    }
  };

  const components = {
    code: CodeBlock,
  };

  // Function to render message content based on visualization status
  const renderContent = () => {
    if (message.isVisualization) {
      if (message.visualizationData) {
        return (
          <div className="w-full h-64 sm:h-80">
            <AlgorithmVisualizer visualizationData={message.visualizationData} />
          </div>
        );
      } else {
        return <div className="text-red-500">Visualization data missing</div>;
      }
    } else {
      return (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {message.text}
        </ReactMarkdown>
      );
    }
  };

  return (
    <>
      <motion.div
        className={`flex flex-col ${containerClassName} max-w-full sm:max-w-2xl mx-2 sm:mx-auto`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className={`p-3 ${bubbleClassName} rounded-xl cursor-pointer hover:opacity-95 transition-opacity`}
          onClick={() => {
            if (message.isVisualization && message.visualizationData) {
              setShowModal(true);
            }
          }}
        >
          {renderContent()}
        </div>
        <span className="text-gray-500 text-xs self-end mt-1 sm:mt-0">
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