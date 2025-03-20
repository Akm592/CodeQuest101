import React, { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import Highlight from "react-highlight";
import "highlight.js/styles/monokai.css"; // Using a dark theme for modern code blocks
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
    ? "bg-blue-600 text-white dark:bg-blue-500 dark:text-gray-100 ml-auto rounded-xl sm:rounded-bl-none"
    : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-xl sm:rounded-br-none";
  const containerClassName = isUserMessage ? "items-end" : "items-start";

  // Custom CodeBlock component for markdown code rendering
  const CodeBlock = ({ inline, className, children, ...props }: any) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || "");

    if (inline) {
      return (
        <code
          className="bg-gray-300 dark:bg-gray-600 rounded-md px-2 py-1 font-mono text-sm text-gray-800 dark:text-gray-200"
          {...props}
        >
          {children}
        </code>
      );
    } else {
      return (
        <div className="relative group my-4 rounded-md border border-gray-600 dark:border-gray-400 shadow-md">
          <button
            className={`absolute top-2 right-2 bg-gray-700 dark:bg-gray-600 text-white dark:text-gray-200 rounded px-2 py-1 text-sm ${
              copied ? "bg-green-500 dark:bg-green-600" : "hover:bg-gray-600 dark:hover:bg-gray-500"
            }`}
            onClick={() => {
              navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <Highlight className={match ? `language-${match[1]}` : ""} {...props}>
            {String(children).replace(/\n$/, "")}
          </Highlight>
        </div>
      );
    }
  };

  // Custom components for ReactMarkdown to style markdown elements
  const components: Components = {
    code: CodeBlock,
    h1: ({ node, ...props }: { node?: any; [key: string]: any }) => (
      <h1 className="text-2xl font-bold mt-4 mb-2 text-gray-900 dark:text-gray-100" {...props} />
    ),
    h2: ({ node, ...props }: { node?: any; [key: string]: any }) => (
      <h2 className="text-xl font-bold mt-4 mb-2 text-gray-900 dark:text-gray-100" {...props} />
    ),
    p: ({ node, ...props }: { node?: any; [key: string]: any }) => (
      <p className="my-2 text-gray-800 dark:text-gray-200" {...props} />
    ),
    ul: ({ node, ...props }: { node?: any; [key: string]: any }) => (
      <ul className="list-disc list-inside my-2 text-gray-800 dark:text-gray-200" {...props} />
    ),
    ol: ({ node, ...props }: { node?: any; [key: string]: any }) => (
      <ol className="list-decimal list-inside my-2 text-gray-800 dark:text-gray-200" {...props} />
    ),
    a: ({ ...props }: { [key: string]: any }) => (
      <a className="text-blue-600 dark:text-blue-400 hover:underline" {...props} />
    ),
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
        return <div className="text-red-500 dark:text-red-400">Visualization data missing</div>;
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
        <span className="text-gray-500 dark:text-gray-400 text-xs self-end mt-1 sm:mt-0">
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