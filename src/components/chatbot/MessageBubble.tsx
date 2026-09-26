import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Copy, Maximize2, Check, Sparkles, User } from "lucide-react";
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
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Handle streaming or skip typewriter cases
  useEffect(() => {
    if (isStreaming || skipTypewriter) {
      setDisplayedText(text);
      setCurrentIndex(text.length);
      setIsComplete(true);
      if (onComplete && !isComplete && text.length > 0) {
        onComplete();
      }
      return;
    }
  }, [text, isStreaming, skipTypewriter, onComplete, isComplete]);

  // Handle typewriter effect for non-streaming content
  useEffect(() => {
    if (isStreaming || skipTypewriter || isComplete) return;

    if (currentIndex < text.length) {
      timeoutRef.current = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(prev => prev + 1);
      }, speed);
    } else if (currentIndex >= text.length && text.length > 0) {
      setIsComplete(true);
      if (onComplete) {
        onComplete();
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, speed, isStreaming, skipTypewriter, text.length, onComplete, isComplete]);

  // Reset state when text changes (only for non-streaming)
  useEffect(() => {
    if (!isStreaming && !skipTypewriter) {
      setCurrentIndex(0);
      setDisplayedText('');
      setIsComplete(false);
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
    if (!isStreaming && !skipTypewriter) {
      if (displayedText === content && content.length > 0) {
        const timer = setTimeout(() => setShowCursor(false), 1000);
        return () => clearTimeout(timer);
      } else {
        setShowCursor(true);
      }
    } else {
      setShowCursor(false); // Don't show cursor during streaming
    }
  }, [displayedText, content, isStreaming, skipTypewriter]);

  return (
    <div className="relative">
      <div className="prose prose-invert max-w-none prose-p:my-1.5 sm:prose-p:my-2 prose-headings:my-2 sm:prose-headings:my-3 prose-pre:bg-transparent prose-pre:p-0 prose-ul:my-1.5 sm:prose-ul:my-2 prose-ol:my-1.5 sm:prose-ol:my-2 prose-li:my-0.5 sm:prose-li:my-1">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={components}
        >
          {displayedText}
        </ReactMarkdown>
      </div>
      {showCursor && !isStreaming && (
        <span className="inline-block w-0.5 h-3 sm:h-4 bg-primary ml-0.5 animate-pulse" />
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

    const codeBlockCount = (currentText.match(/```/g) || []).length;
    const headerCount = (currentText.match(/^#{1,6}\s/gm) || []).length;
    const listCount = (currentText.match(/^[*\-+]\s/gm) || []).length;
    const orderedListCount = (currentText.match(/^\d+\.\s/gm) || []).length;
    const wordCount = currentText.split(/\s+/).length;
    const lineCount = currentText.split('\n').length;
    const boldCount = (currentText.match(/\*\*.*?\*\*/g) || []).length;
    const tableCount = (currentText.match(/\|.*\|/g) || []).length;

    return codeBlockCount >= 1 ||
      headerCount > 2 ||
      listCount > 4 ||
      orderedListCount > 3 ||
      wordCount > 300 ||
      lineCount > 15 ||
      boldCount > 3 ||
      tableCount > 0;
  }, [currentText]);

  // Enhanced Code Block Component with mobile responsiveness
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
          className={`px-1.5 sm:px-2 py-1 rounded-md font-mono text-xs sm:text-sm font-medium break-all ${isUserMessage
            ? 'bg-white/20 text-foreground'
            : 'bg-black/40 text-primary border border-primary/20'
            }`}
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <div className="relative group my-3 sm:my-4 text-xs sm:text-sm rounded-xl overflow-hidden border border-white/10 shadow-lg bg-background w-full">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-white/5 border-b border-white/5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">
            {language}
          </span>
          <button
            onClick={handleCopy}
            className={`flex items-center justify-center p-1.5 rounded-md text-xs transition-all duration-200 flex-shrink-0 ml-2 ${codeCopied
              ? 'bg-viz-found/20 text-viz-found'
              : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
              }`}
            aria-label={codeCopied ? "Copied" : "Copy code"}
          >
            {codeCopied ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
          </button>
        </div>
        <div className="relative overflow-x-auto">
          <SyntaxHighlighter
            style={atomOneDark}
            language={language}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: '0.75rem 0.75rem',
              background: 'transparent',
              fontSize: '0.7rem',
              lineHeight: '1.4',
              minWidth: '100%'
            }}
            codeTagProps={{
              style: {
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                whiteSpace: 'pre',
                overflowWrap: 'normal'
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

  // Inside a user bubble the background IS the teal accent, so every colour
  // here has to come from the bubble's own foreground. The previous values were
  // written for a dark bubble and quietly broke on the light one:
  // text-primary on bg-primary is 1:1 (invisible), text-foreground is ~1.9:1.
  // Any user message with bold text, a link or a list was unreadable.
  const tone = {
    heading: isUserMessage ? "text-current" : "text-primary",
    strong: isUserMessage ? "text-current" : "text-primary",
    body: isUserMessage ? "text-current" : "text-foreground",
    muted: isUserMessage ? "text-current opacity-90" : "text-muted-foreground",
    link: isUserMessage ? "text-current" : "text-primary",
  };

  // Enhanced markdown components with mobile-responsive styling
  const memoizedComponents = useMemo((): Components => ({
    code: CodeBlock,
    h1: ({ node, ...props }) => (
      <h1 className={`text-xl sm:text-2xl font-bold mt-4 sm:mt-6 mb-3 sm:mb-4 pb-2 border-b border-current/30 ${tone.heading}`} {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className={`text-lg sm:text-xl font-semibold mt-4 sm:mt-5 mb-2 sm:mb-3 ${tone.heading}`} {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className={`text-base sm:text-lg font-semibold mt-3 sm:mt-4 mb-2 ${tone.body}`} {...props} />
    ),
    h4: ({ node, ...props }) => (
      <h4 className={`text-sm sm:text-base font-semibold mt-3 mb-2 ${tone.body}`} {...props} />
    ),
    h5: ({ node, ...props }) => (
      <h5 className={`text-sm font-semibold mt-2 sm:mt-3 mb-2 ${tone.muted}`} {...props} />
    ),
    h6: ({ node, ...props }) => (
      <h6 className={`text-xs sm:text-sm font-semibold mt-2 mb-2 ${tone.muted}`} {...props} />
    ),
    p: ({ node, ...props }) => (
      <p className={`my-2 sm:my-3 leading-6 sm:leading-7 text-sm sm:text-base ${tone.body}`} {...props} />
    ),
    ul: ({ node, ...props }) => (
      <ul className={`list-disc list-outside pl-4 sm:pl-6 my-2 sm:my-3 space-y-1 sm:space-y-2 text-sm sm:text-base ${tone.muted}`} {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className={`list-decimal list-outside pl-4 sm:pl-6 my-2 sm:my-3 space-y-1 sm:space-y-2 text-sm sm:text-base ${tone.muted}`} {...props} />
    ),
    li: ({ node, ...props }) => (
      <li className="pl-1 leading-5 sm:leading-6" {...props} />
    ),
    a: ({ node, ...props }) => (
      <a
        className={`underline font-medium transition-colors duration-200 break-words ${tone.link}`}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
    strong: ({ node, ...props }) => (
      <strong className={`font-semibold ${tone.strong}`} {...props} />
    ),
    em: ({ node, ...props }) => (
      <em className={`italic ${tone.muted}`} {...props} />
    ),
    blockquote: ({ node, ...props }) => (
      <blockquote className={`border-l-4 border-current/40 pl-4 sm:pl-6 py-2 sm:py-3 my-3 sm:my-4 bg-black/10 rounded-r-lg italic text-sm sm:text-base ${tone.muted}`} {...props} />
    ),
    hr: ({ node, ...props }) => (
      <hr className="my-4 sm:my-6 border-white/10" {...props} />
    ),
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto my-3 sm:my-4 -mx-2 sm:mx-0">
        <table className="min-w-full border border-white/10 rounded-lg text-xs sm:text-sm" {...props} />
      </div>
    ),
    thead: ({ node, ...props }) => (
      <thead className="bg-white/5" {...props} />
    ),
    th: ({ node, ...props }) => (
      <th className="px-2 sm:px-4 py-1.5 sm:py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-white/10" {...props} />
    ),
    td: ({ node, ...props }) => (
      <td className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border-b border-current/10 ${tone.muted}`} {...props} />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [resolvedTheme, isUserMessage]);

  const bubbleClassName = useMemo(() => {
    const baseStyle = `px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl border break-words transition-colors duration-200`;

    // max-w-full, not max-w-[calc(100vw-2rem)]. The bubble sits inside a
    // max-w-5xl column that already has three levels of horizontal padding, so
    // a viewport-derived width was both wrong for the space available and
    // wrong on desktop, where 100vw includes the scrollbar gutter.
    const sizeClass = isComplexContent
      ? 'max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl'
      : 'max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl';

    // The user bubble was `from-primary to-blue-600` with text-white. Two
    // problems: blue-600 is the pre-rebrand accent, and white on teal-400
    // measures 1.87:1 — the same contrast failure fixed everywhere else, which
    // survived here only because the UI checker never renders a message.
    // primary/primary-foreground is the pairing every button already uses.
    const styleClass = isUserMessage
      ? 'bg-primary text-primary-foreground border-transparent ml-auto rounded-br-md'
      : 'bg-card text-foreground border-border mr-auto rounded-bl-md';

    return `${baseStyle} ${sizeClass} ${styleClass}`;
  }, [isUserMessage, isComplexContent]);

  const containerClassName = `flex flex-col ${isUserMessage ? "items-end" : "items-start"} mb-4 sm:mb-6 group`;

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
        <div className="relative group cursor-pointer w-full" onClick={() => setShowModal(true)}>
          <div className="w-full h-40 sm:h-56 md:h-72 lg:h-80 rounded-xl overflow-hidden border border-white/10 bg-black/20">
            <AlgorithmVisualizer visualizationData={message.visualizationData} />
          </div>
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl">
            <div className="p-3 bg-black/60 rounded-full backdrop-blur-sm border border-white/20">
              <Maximize2 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      );
    }

    if (currentText) {
      // For streaming messages, always display immediately
      if (isStreaming) {
        return (
          <div className="prose prose-invert max-w-none prose-p:my-1.5 sm:prose-p:my-2 prose-headings:my-2 sm:prose-headings:my-3 prose-pre:bg-transparent prose-pre:p-0 prose-ul:my-1.5 sm:prose-ul:my-2 prose-ol:my-1.5 sm:prose-ol:my-2 prose-li:my-0.5 sm:prose-li:my-1">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={memoizedComponents}
            >
              {currentText}
            </ReactMarkdown>
            {/* Show typing cursor during streaming */}
            <span className="inline-block w-1.5 h-4 bg-primary ml-1 animate-pulse" />
          </div>
        );
      }

      // For user messages or complex content, display immediately
      if (isUserMessage || isComplexContent) {
        return (
          <div className="prose prose-invert max-w-none prose-p:my-1.5 sm:prose-p:my-2 prose-headings:my-2 sm:prose-headings:my-3 prose-pre:bg-transparent prose-pre:p-0 prose-ul:my-1.5 sm:prose-ul:my-2 prose-ol:my-1.5 sm:prose-ol:my-2 prose-li:my-0.5 sm:prose-li:my-1">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={memoizedComponents}
            >
              {currentText}
            </ReactMarkdown>
          </div>
        );
      } else {
        // Use typewriter effect only for simple, non-streaming bot messages
        return (
          <TypewriterMarkdown
            content={currentText}
            components={memoizedComponents}
            isStreaming={false}
            speed={15}
            onComplete={handleTypingComplete}
            skipTypewriter={false}
          />
        );
      }
    }

    return <span className="italic text-muted-foreground text-sm">(Empty message)</span>;
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
        <div className={`mb-1.5 flex items-center gap-2 ${isUserMessage ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex h-7 w-7 items-center justify-center rounded-full border border-border ${isUserMessage ? 'bg-primary text-primary-foreground' : 'bg-popover text-primary'}`}>
            {isUserMessage ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
          </div>
          {/* Always legible. Hover-to-reveal means never, on a touch screen. */}
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {isUserMessage ? 'You' : 'AI Architect'}
          </span>
        </div>

        <div className={bubbleClassName}>
          {renderContent()}
        </div>
        <span className={`text-muted-foreground text-[10px] mt-1.5 px-1 ${isUserMessage ? 'mr-1' : 'ml-1'}`}>
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
