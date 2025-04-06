// MessageBubble.tsx
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

import { Copy, Maximize2, Check } from "lucide-react";
import AlgorithmVisualizer from "../Visualizer/AlgorithmVisualizer"; // Adjust path if needed
import VisualizationModal from "../Visualizer/VisualizationModal"; // Adjust path if needed


interface MessageBubbleProps {
  message: {
    id: string;
    sender: "user" | "bot";
    text: string;
    timestamp: string;
    isVisualization?: boolean;
    visualizationData?: any;
  };
   isLastMessage?: boolean; // Optional prop
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message}) => {
  const [showModal, setShowModal] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  // Replace with your actual theme detection logic if not using next-themes
  // const { resolvedTheme } = useTheme(); // Example using next-themes
  // For standalone, check dark class on html or use localStorage/context
  const resolvedTheme = typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light';

  const isUserMessage = message.sender === "user";

  // Glassmorphic styles based on sender
  const bubbleBaseStyle = `p-3 md:p-4 rounded-2xl shadow-md max-w-lg lg:max-w-xl xl:max-w-2xl
                           border border-white/10 dark:border-white/5 backdrop-blur-lg transition-all duration-300`;
  const userBubbleStyle = `bg-blue-500/50 text-white dark:bg-blue-600/60 dark:text-gray-50 ml-auto rounded-br-none`;
  const botBubbleStyle = `bg-white/60 text-gray-800 dark:bg-gray-800/60 dark:text-gray-100 mr-auto rounded-bl-none`;

  const bubbleClassName = `${bubbleBaseStyle} ${isUserMessage ? userBubbleStyle : botBubbleStyle}`;
  const containerClassName = `flex flex-col ${isUserMessage ? "items-end" : "items-start"} mb-4`; // Added margin-bottom

  // --- Custom Code Block Component for Markdown ---
  const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'text'; // Default to plain text if no language detected
    const codeString = String(children).replace(/\n$/, ''); // Clean up the code string

    const handleCopy = () => {
        navigator.clipboard.writeText(codeString);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
    }

    if (inline) {
      // Inline code style
      return (
        <code
          className={`px-1.5 py-0.5 rounded-md font-mono text-sm ${
            isUserMessage
              ? 'bg-white/20 text-blue-100' // Inline code within user message
              : 'bg-gray-500/20 dark:bg-gray-400/20 text-gray-700 dark:text-gray-300' // Inline code within bot message
          }`}
          {...props}
        >
          {children}
        </code>
      );
    } else {
      // Block code style
      return (
        <div className="relative group my-3 text-sm rounded-lg overflow-hidden border border-black/10 dark:border-white/10 shadow-md">
           <div className="flex items-center justify-between px-3 py-1.5 bg-gray-200/50 dark:bg-gray-900/60 border-b border-black/10 dark:border-white/10">
               <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{language}</span>
                <button
                    onClick={handleCopy}
                    className={`flex items-center justify-center p-1 rounded-md text-xs transition-colors duration-200 ${
                        codeCopied
                        ? 'bg-green-500/20 text-green-700 dark:text-green-300'
                        : 'bg-gray-500/10 dark:bg-gray-400/10 text-gray-500 dark:text-gray-400 hover:bg-gray-500/20 dark:hover:bg-gray-400/20 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                    aria-label={codeCopied ? "Copied" : "Copy code"}
                >
                   {codeCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
           </div>
          <SyntaxHighlighter
            style={resolvedTheme === 'dark' ? { backgroundColor: '#2d2d2d', color: '#f8f8f2' } : { backgroundColor: '#fff', color: '#000' }} // Choose theme based on light/dark mode
            language={language}
            PreTag="div" // Use div instead of pre for better styling control
            customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }} // Remove default padding/bg
            codeTagProps={{ style: { fontFamily: 'var(--font-mono)' } }} // Use CSS variable for font
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      );
    }
  };

  // Memoize components to prevent unnecessary re-renders
  const memoizedComponents = useMemo((): Components => ({
        code: CodeBlock,
        // Add other markdown element styling here if needed
        h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2 border-b pb-1 border-black/10 dark:border-white/10" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-lg font-semibold mt-3 mb-1" {...props} />,
        p: ({ node, ...props }) => <p className="my-2 leading-relaxed" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc list-outside pl-5 my-2 space-y-1" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal list-outside pl-5 my-2 space-y-1" {...props} />,
        a: ({ node, ...props }) => <a className="text-blue-600 dark:text-blue-400 hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
        strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
        em: ({ node, ...props }) => <em className="italic" {...props} />,
        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-3 text-gray-600 dark:text-gray-400" {...props} />,
        hr: ({ node, ...props }) => <hr className="my-4 border-gray-300 dark:border-gray-600" {...props} />,
  }), [resolvedTheme, isUserMessage]); // Recompute if theme or sender type changes

  // --- Content Rendering Logic ---
  const renderContent = () => {
    if (message.isVisualization && message.visualizationData) {
      return (
         <div className="relative group cursor-pointer" onClick={() => setShowModal(true)}>
            <div className="w-full h-64 sm:h-80 rounded-lg overflow-hidden border border-white/10 dark:border-black/20">
                <AlgorithmVisualizer visualizationData={message.visualizationData} />
            </div>
             {/* Expand Icon Overlay */}
             <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg">
                <Maximize2 className="w-8 h-8 text-white/80" />
             </div>
         </div>
      );
    } else if (message.text) { // Check if text exists
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-pre:bg-transparent prose-pre:p-0"> {/* Tailwind Prose for styling */}
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={memoizedComponents}
                // linkTarget="_blank" // Handled in custom 'a' component
            >
                {message.text}
            </ReactMarkdown>
        </div>
      );
    } else {
        // Handle empty message case if necessary (e.g., show placeholder or nothing)
        return <span className="italic text-gray-400 dark:text-gray-500">(Empty message)</span>;
    }
  };

  return (
    <>
      <motion.div
        layout // Animate layout changes smoothly
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
        transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.9 }}
        className={containerClassName}
      >
        <div className={bubbleClassName}>
            {renderContent()}
        </div>
        <span className={`text-gray-500 dark:text-gray-400 text-xs mt-1.5 ${isUserMessage ? 'mr-1' : 'ml-1'}`}>
          {message.timestamp}
        </span>
      </motion.div>

      {/* Visualization Modal */}
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