// MessageBubble.tsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark, atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Copy, Maximize2, Check } from "lucide-react";
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
    isStreaming?: boolean;
  };
  isLastMessage?: boolean;
  streamingText?: string;
  onStreamComplete?: () => void;
}

// Enhanced typewriter hook with complex content detection
const useTypewriter = (
  text: string, 
  speed: number = 20, 
  isStreaming: boolean = false,
  onComplete?: () => void,
  skipTypewriter: boolean = false
) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isStreaming || skipTypewriter) {
      // Display immediately for streaming or complex content
      setDisplayedText(text);
      setCurrentIndex(text.length);
      if (onComplete && text.length > 0) {
        onComplete();
      }
    } else if (currentIndex < text.length) {
      // Use typewriter effect for simple content
      timeoutRef.current = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);
    } else if (currentIndex >= text.length && onComplete) {
      onComplete();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, currentIndex, speed, isStreaming, onComplete, skipTypewriter]);

  // Reset when text changes
  useEffect(() => {
    if (!isStreaming && !skipTypewriter) {
      setCurrentIndex(0);
      setDisplayedText('');
    }
  }, [text, isStreaming, skipTypewriter]);

  return displayedText;
};

// Enhanced Typewriter Markdown Component
const TypewriterMarkdown: React.FC<{
  content: string;
  components: Components;
  isStreaming?: boolean;
  speed?: number;
  onComplete?: () => void;
  skipTypewriter?: boolean;
}> = ({ content, components, isStreaming = false, speed = 15, onComplete, skipTypewriter = false }) => {
  const displayedText = useTypewriter(content, speed, isStreaming, onComplete, skipTypewriter);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (displayedText === content && !isStreaming) {
      const timer = setTimeout(() => setShowCursor(false), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowCursor(true);
    }
  }, [displayedText, content, isStreaming]);

  return (
    <div className="relative">
      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-pre:bg-transparent prose-pre:p-0 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={components}
        >
          {displayedText}
        </ReactMarkdown>
      </div>
      {(showCursor && (isStreaming || displayedText !== content) && !skipTypewriter) && (
        <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse" />
      )}
    </div>
  );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  streamingText,
  onStreamComplete 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  void isTypingComplete;
  
  const resolvedTheme = typeof window !== 'undefined' && 
    document.documentElement.classList.contains('dark') ? 'dark' : 'light';

  const isUserMessage = message.sender === "user";
  const isStreaming = message.isStreaming || !!streamingText;
  const currentText = streamingText || message.text;

  // Detect complex content that should skip typewriter effect
  const isComplexContent = useMemo(() => {
    if (!currentText) return false;

    const codeBlockCount = (currentText.match(/```/g) || []).length / 2; // Each code block has opening and closing ```
    const headerCount = (currentText.match(/^#{1,6}\s/gm) || []).length;
    const listCount = (currentText.match(/^[\*\-\+]\s/gm) || []).length;
    const orderedListCount = (currentText.match(/^\d+\.\s/gm) || []).length;
    const wordCount = currentText.split(/\s+/).length;
    const lineCount = currentText.split('\n').length;
    const boldCount = (currentText.match(/\*\*.*?\*\*/g) || []).length;
    const tableCount = (currentText.match(/\|.*\|/g) || []).length;

    // Consider content complex if it has multiple structural elements or is very long
    return codeBlockCount >= 1 ||
           headerCount > 2 ||
           listCount > 4 ||
           orderedListCount > 3 ||
           wordCount > 300 ||
           lineCount > 15 ||
           boldCount > 3 ||
           tableCount > 0;
  }, [currentText]);

  // Enhanced Code Block Component with proper syntax highlighting
  const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'text';
    const codeString = String(children).replace(/\n$/, '');

    const handleCopy = () => {
      navigator.clipboard.writeText(codeString);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    };

    if (inline) {
      return (
        <code
          className={`px-2 py-1 rounded-md font-mono text-sm font-medium ${
            isUserMessage
              ? 'bg-white/20 text-blue-100'
              : 'bg-blue-100/80 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border border-blue-200/50 dark:border-blue-700/50'
          }`}
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <div className="relative group my-4 text-sm rounded-xl overflow-hidden border border-gray-200/80 dark:border-gray-700/80 shadow-lg bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200/50 dark:border-gray-700/50">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {language}
          </span>
          <button
            onClick={handleCopy}
            className={`flex items-center justify-center p-1.5 rounded-md text-xs transition-all duration-200 ${
              codeCopied
                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
            aria-label={codeCopied ? "Copied" : "Copy code"}
          >
            {codeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="relative">
          <SyntaxHighlighter
            style={resolvedTheme === 'dark' ? atomOneDark : atomOneLight}
            language={language}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: '1.25rem',
              background: 'transparent',
              fontSize: '0.875rem',
              lineHeight: '1.5'
            }}
            codeTagProps={{
              style: {
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
              }
            }}
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  };

  // Enhanced markdown components with better styling
  const memoizedComponents = useMemo((): Components => ({
    code: CodeBlock,
    h1: ({ node, ...props }) => (
      <h1 className="text-2xl font-bold mt-6 mb-4 pb-2 border-b-2 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-xl font-semibold mt-5 mb-3 text-blue-700 dark:text-blue-300" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200" {...props} />
    ),
    h4: ({ node, ...props }) => (
      <h4 className="text-md font-semibold mt-3 mb-2 text-gray-700 dark:text-gray-300" {...props} />
    ),
    h5: ({ node, ...props }) => (
      <h5 className="text-sm font-semibold mt-3 mb-2 text-gray-700 dark:text-gray-300" {...props} />
    ),
    h6: ({ node, ...props }) => (
      <h6 className="text-xs font-semibold mt-2 mb-2 text-gray-600 dark:text-gray-400" {...props} />
    ),
    p: ({ node, ...props }) => (
      <p className="my-3 leading-7 text-gray-700 dark:text-gray-300" {...props} />
    ),
    ul: ({ node, ...props }) => (
      <ul className="list-disc list-outside pl-6 my-3 space-y-2 text-gray-700 dark:text-gray-300" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className="list-decimal list-outside pl-6 my-3 space-y-2 text-gray-700 dark:text-gray-300" {...props} />
    ),
    li: ({ node, ...props }) => (
      <li className="pl-1 leading-6" {...props} />
    ),
    a: ({ node, ...props }) => (
      <a 
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium transition-colors duration-200" 
        target="_blank" 
        rel="noopener noreferrer" 
        {...props} 
      />
    ),
    strong: ({ node, ...props }) => (
      <strong className="font-semibold text-blue-800 dark:text-blue-200" {...props} />
    ),
    em: ({ node, ...props }) => (
      <em className="italic text-gray-600 dark:text-gray-400" {...props} />
    ),
    blockquote: ({ node, ...props }) => (
      <blockquote className="border-l-4 border-blue-300 dark:border-blue-600 pl-6 py-3 my-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-r-lg italic text-gray-700 dark:text-gray-300" {...props} />
    ),
    hr: ({ node, ...props }) => (
      <hr className="my-6 border-gray-300 dark:border-gray-600" {...props} />
    ),
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg" {...props} />
      </div>
    ),
    thead: ({ node, ...props }) => (
      <thead className="bg-gray-50 dark:bg-gray-800" {...props} />
    ),
    th: ({ node, ...props }) => (
      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700" {...props} />
    ),
    td: ({ node, ...props }) => (
      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700" {...props} />
    ),
  }), [resolvedTheme, isUserMessage]);

  // Dynamic container sizing based on content complexity
  const bubbleClassName = useMemo(() => {
    const baseStyle = `p-4 md:p-5 rounded-2xl shadow-lg border border-white/10 dark:border-white/5 backdrop-blur-lg transition-all duration-300`;
    const sizeClass = isComplexContent 
      ? 'max-w-3xl lg:max-w-4xl xl:max-w-5xl' 
      : 'max-w-lg lg:max-w-xl xl:max-w-2xl';
    
    const styleClass = isUserMessage 
      ? 'bg-blue-500/50 text-white dark:bg-blue-600/60 dark:text-gray-50 ml-auto rounded-br-none'
      : 'bg-white/70 text-gray-800 dark:bg-gray-800/70 dark:text-gray-100 mr-auto rounded-bl-none';
    
    return `${baseStyle} ${sizeClass} ${styleClass}`;
  }, [isUserMessage, isComplexContent]);

  const containerClassName = `flex flex-col ${isUserMessage ? "items-end" : "items-start"} mb-6`;

  // Handle typing completion
  const handleTypingComplete = () => {
    setIsTypingComplete(true);
    if (onStreamComplete) {
      onStreamComplete();
    }
  };

  // Content rendering logic
  const renderContent = () => {
    if (message.isVisualization && message.visualizationData) {
      return (
        <div className="relative group cursor-pointer" onClick={() => setShowModal(true)}>
          <div className="w-full h-64 sm:h-80 rounded-lg overflow-hidden border border-white/10 dark:border-black/20">
            <AlgorithmVisualizer visualizationData={message.visualizationData} />
          </div>
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg">
            <Maximize2 className="w-8 h-8 text-white/80" />
          </div>
        </div>
      );
    }

    if (currentText) {
      // Use immediate display for user messages or complex content
      if (isUserMessage || isComplexContent) {
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-pre:bg-transparent prose-pre:p-0 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={memoizedComponents}
            >
              {currentText}
            </ReactMarkdown>
          </div>
        );
      } else {
        // Use typewriter effect for simple bot messages
        return (
          <TypewriterMarkdown
            content={currentText}
            components={memoizedComponents}
            isStreaming={isStreaming}
            speed={15}
            onComplete={handleTypingComplete}
            skipTypewriter={isComplexContent}
          />
        );
      }
    }

    return <span className="italic text-gray-400 dark:text-gray-500">(Empty message)</span>;
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
        transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.9 }}
        className={containerClassName}
      >
        <div className={bubbleClassName}>
          {renderContent()}
        </div>
        <span className={`text-gray-500 dark:text-gray-400 text-xs mt-2 ${isUserMessage ? 'mr-1' : 'ml-1'}`}>
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
