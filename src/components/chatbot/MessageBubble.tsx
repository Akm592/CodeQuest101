import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Message } from "./chatBot";
import AlgorithmVisualizer from "../Visualizer/AlgorithmVisualizer"; // Ensure the import path is correct

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  console.log("Rendering MessageBubble with message:", message);

  const isUserMessage = message.sender === "user";
  const bubbleClassName = isUserMessage
    ? "bg-blue-500 text-white ml-auto rounded-bl-none"
    : "bg-gray-300 text-gray-800 rounded-br-none";
  const containerClassName = isUserMessage ? "items-end" : "items-start";

  // Custom markdown components with explicit types
  const components = {
    p: ({ children }: { children: React.ReactNode }) => (
      <p className="mb-2 last:mb-0">{children}</p>
    ),
    code: ({
      node,
      inline,
      className,
      children,
      ...props
    }: {
      node: any;
      inline: boolean;
      className?: string;
      children: React.ReactNode;
    }) => (
      <code
        className={`${
          inline ? "bg-opacity-20 px-1 py-0.5 rounded" : "block p-3 rounded-lg"
        } ${
          isUserMessage ? "bg-white bg-opacity-10" : "bg-gray-700 bg-opacity-10"
        } ${className || ""}`}
        {...props}
      >
        {children}
      </code>
    ),
    pre: ({ children }: { children: React.ReactNode }) => (
      <pre className="mb-2 last:mb-0 w-full overflow-x-auto">{children}</pre>
    ),
    a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
      <a
        href={href}
        className={`underline ${
          isUserMessage ? "text-white" : "text-blue-600"
        }`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    ul: ({ children }: { children: React.ReactNode }) => (
      <ul className="list-disc ml-6 mb-2 last:mb-0">{children}</ul>
    ),
    ol: ({ children }: { children: React.ReactNode }) => (
      <ol className="list-decimal ml-6 mb-2 last:mb-0">{children}</ol>
    ),
    h1: ({ children }: { children: React.ReactNode }) => (
      <h1 className="text-xl font-bold mb-2">{children}</h1>
    ),
    h2: ({ children }: { children: React.ReactNode }) => (
      <h2 className="text-lg font-bold mb-2">{children}</h2>
    ),
    h3: ({ children }: { children: React.ReactNode }) => (
      <h3 className="text-base font-bold mb-2">{children}</h3>
    ),
  };

  return (
    <motion.div
      className={`flex flex-col ${containerClassName} w-full p-10`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ border: "1px solid red" }} // TEMP: debug border to see element boundaries
    >
      <div className={`p-3 ${bubbleClassName} rounded-xl mb-1 overflow-hidden`}>
        {message.isVisualization && message.visualizationData ? (
          // Render the visualization if available
          <AlgorithmVisualizer visualizationData={message.visualizationData} />
        ) : (
          // Otherwise, render the markdown text
          <ReactMarkdown
            components={components}
            className="prose prose-sm max-w-none"
          >
            {message.text || "No content available"}
          </ReactMarkdown>
        )}
      </div>
      <span className="text-gray-500 text-xs self-end">
        {message.timestamp}
      </span>
    </motion.div>
  );
};

export default MessageBubble;
