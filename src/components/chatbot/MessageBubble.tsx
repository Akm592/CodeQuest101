import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Copy, Check, Play, Sparkles, User } from "lucide-react";
import VisualizationModal from "../Visualizer/VisualizationModal";
import ScenePlayer, { type SceneSource } from "../visualizer-player/ScenePlayer";
import { legacyToScene } from "../../lib/scene/legacy";
import type { Suggestion } from "../../lib/scene/types";
import type { ChatMessage } from "./types";

// Messages whose suggestion has already been auto-opened. Module-level, not
// component state: a bubble remounts when the list re-renders, and the player
// must open once per answer, not every time the bubble is mounted again.
const autoOpened = new Set<string>();

/** "▶ Hash map lookup for [2,7,11,15]" chips under an answer. */
const SuggestionChips: React.FC<{
  suggestions: Suggestion[];
  onOpen: (s: Suggestion) => void;
}> = ({ suggestions, onOpen }) => (
  <div className="mt-2 w-full max-w-full sm:max-w-2xl" data-viz-suggestions="">
    <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
      <Sparkles className="h-3 w-3 text-primary" aria-hidden="true" /> See it step by step
    </p>
    <div className="flex flex-wrap gap-2">
      {suggestions.map((s) => (
        <button
          key={s.title}
          type="button"
          onClick={() => onOpen(s)}
          className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-left text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/20"
        >
          <Play className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" aria-hidden="true" />
          <span className="min-w-0">{s.title}</span>
        </button>
      ))}
    </div>
  </div>
);

interface MessageBubbleProps {
  message: ChatMessage;
  isLastMessage?: boolean;
  streamingText?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  streamingText,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [player, setPlayer] = useState<{ title: string; source: SceneSource; ai: boolean } | null>(null);

  const openSuggestion = React.useCallback(
    (s: Suggestion) => {
      // Nothing about the visualization exists until this click: the backend
      // reads the conversation, picks an example and traces it now.
      setPlayer({
        title: s.title,
        source: { kind: "fetch", context: message.vizContext ?? message.text, trace: s.trace },
        ai: true,
      });
    },
    [message.vizContext, message.text],
  );

  // "Visualize bubble sort on [5,1,4]": the user asked, so open the first
  // suggestion as soon as it arrives instead of making them click.
  useEffect(() => {
    const first = message.suggestions?.[0];
    if (!message.autoOpenSuggestion || !first || autoOpened.has(message.id)) return;
    autoOpened.add(message.id);
    openSuggestion(first);
  }, [message.autoOpenSuggestion, message.suggestions, message.id, openSuggestion]);

  // Visualizations saved by the old backend: open in the new player when they
  // convert, otherwise in the old renderer.
  const legacyScene = useMemo(
    () => (message.isVisualization ? legacyToScene(message.visualizationData) : null),
    [message.isVisualization, message.visualizationData],
  );
  const openLegacy = () => {
    if (legacyScene) {
      setPlayer({ title: legacyScene.title, source: { kind: "ready", scene: legacyScene }, ai: true });
    } else {
      setShowModal(true);
    }
  };
  const [codeCopied, setCodeCopied] = useState(false);

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

  // Content rendering logic
  const renderContent = () => {
    // Not a live canvas any more: every inline p5 sketch redrew at 60fps for
    // as long as it was in the history, and listened to keys and clicks on
    // the whole page.
    if (message.isVisualization && message.visualizationData) {
      return (
        <button
          type="button"
          onClick={openLegacy}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-primary/20"
        >
          <Play className="h-4 w-4 shrink-0 fill-primary text-primary" aria-hidden="true" />
          Open visualization{legacyScene ? `: ${legacyScene.title}` : ""}
        </button>
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

      // Shown in full as soon as it arrives. Simple answers used to be typed
      // out again at 15ms a character after they had already arrived, adding
      // ~20 seconds to a 1,500-character reply.
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
        {!isUserMessage && message.suggestions && message.suggestions.length > 0 && (
          <SuggestionChips suggestions={message.suggestions} onOpen={openSuggestion} />
        )}
        <span className={`text-muted-foreground text-[10px] mt-1.5 px-1 ${isUserMessage ? 'mr-1' : 'ml-1'}`}>
          {message.timestamp}
        </span>
      </motion.div>

      {player && (
        <ScenePlayer
          title={player.title}
          source={player.source}
          aiGenerated={player.ai}
          onClose={() => setPlayer(null)}
        />
      )}

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
