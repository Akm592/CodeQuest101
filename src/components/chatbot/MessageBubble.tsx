import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Message } from "./chatBot";

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUserMessage = message.sender === "user";
  const bubbleClassName = isUserMessage
    ? "bg-blue-500 text-white ml-auto rounded-bl-none"
    : "bg-gray-300 text-gray-800 rounded-br-none";
  const containerClassName = isUserMessage ? "items-end" : "items-start";

  // Custom components for markdown elements
  const components = {
    // Style paragraphs
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,

    // Style code blocks
    code: ({ node, inline, className, children, ...props }) => (
      <code
        className={`${
          inline ? "bg-opacity-20 px-1 py-0.5 rounded" : "block p-3 rounded-lg"
        } 
          ${
            isUserMessage
              ? "bg-white bg-opacity-10"
              : "bg-gray-700 bg-opacity-10"
          }
          ${className || ""}`}
        {...props}
      >
        {children}
      </code>
    ),

    // Style code blocks container
    pre: ({ children }) => (
      <pre className="mb-2 last:mb-0 w-full overflow-x-auto">{children}</pre>
    ),

    // Style links
    a: ({ href, children }) => (
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

    // Style lists
    ul: ({ children }) => (
      <ul className="list-disc ml-6 mb-2 last:mb-0">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal ml-6 mb-2 last:mb-0">{children}</ol>
    ),

    // Style headings
    h1: ({ children }) => (
      <h1 className="text-xl font-bold mb-2">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-lg font-bold mb-2">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-base font-bold mb-2">{children}</h3>
    ),
  };

  return (
    <motion.div
      className={`flex flex-col ${containerClassName} max-w-screen p-10`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`p-3 ${bubbleClassName} rounded-xl mb-1 overflow-hidden`}>
        <ReactMarkdown
          components={components}
          className="prose prose-sm max-w-none"
        >
          {message.text}
        </ReactMarkdown>
      </div>
      <span className="text-gray-500 text-xs self-end">
        {message.timestamp}
      </span>
    </motion.div>
  );
};

export default MessageBubble;
