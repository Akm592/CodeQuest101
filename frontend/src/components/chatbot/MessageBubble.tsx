import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Copy, Check, Play, Sparkles, RotateCcw } from "lucide-react";
import VisualizationModal from "../Visualizer/VisualizationModal";
import ScenePlayer, { type SceneSource } from "../visualizer-player/ScenePlayer";
import { legacyToScene } from "../../lib/scene/legacy";
import type { Suggestion } from "../../lib/scene/types";
import type { ChatMessage, MessageActions } from "./types";

// Messages whose suggestion has already been auto-opened. Module-level, not
// component state: a bubble remounts when the list re-renders, and the player
// must open once per answer, not every time the bubble is mounted again.
const autoOpened = new Set<string>();

/** "▶ Hash map lookup for [2,7,11,15]" chips under an answer. */
const SuggestionChips: React.FC<{
  suggestions: Suggestion[];
  onOpen: (s: Suggestion) => void;
}> = ({ suggestions, onOpen }) => (
  <div className="mt-4 w-full max-w-full" data-viz-suggestions="">
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

/**
 * A fenced code block. Its own component, with its own copied state: it used
 * to be defined inside MessageBubble and cached with incomplete deps, so the
 * "copied" tick read a stale value and never appeared, and every block in a
 * message shared one flag.
 */
const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard
      ?.writeText(code)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  return (
    <div className="relative group my-3 sm:my-4 text-xs sm:text-sm rounded-xl overflow-hidden border border-white/10 shadow-lg bg-background w-full">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-white/5 border-b border-white/5">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 justify-center px-2 py-1.5 rounded-md text-xs transition-all duration-200 flex-shrink-0 ml-2 ${copied
            ? 'bg-viz-found/20 text-viz-found'
            : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
            }`}
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <div className="relative overflow-x-auto">
        <SyntaxHighlighter
          style={atomOneDark}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: '0.75rem 1rem',
            background: 'transparent',
            fontSize: '0.8125rem',
            lineHeight: '1.55',
            minWidth: '100%'
          }}
          codeTagProps={{
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              whiteSpace: 'pre',
              overflowWrap: 'normal'
            }
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

/** One tap answers "which language?". */
const QUICK_LANGUAGES = ["Python", "Java", "C++", "JavaScript", "Go", "C#"];

const LanguageButtons: React.FC<{ onPick: (language: string) => void }> = ({ onPick }) => (
  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Choose a language">
    {QUICK_LANGUAGES.map((language) => (
      <button
        key={language}
        type="button"
        onClick={() => onPick(language)}
        className="min-h-11 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/20"
      >
        {language}
      </button>
    ))}
  </div>
);

/** Copy answer / Regenerate under a bot message. */
const AnswerActions: React.FC<{
  text: string;
  canRegenerate: boolean;
  onRegenerate?: () => void;
}> = ({ text, canRegenerate, onRegenerate }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };
  const button =
    "inline-flex min-h-11 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground";
  return (
    <div className="flex items-center gap-1">
      {text && (
        <button type="button" onClick={copy} className={button} aria-label={copied ? "Copied" : "Copy answer"}>
          {copied ? <Check className="h-3.5 w-3.5 text-viz-found" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      )}
      {canRegenerate && onRegenerate && (
        <button type="button" onClick={onRegenerate} className={button} aria-label="Regenerate answer">
          <RotateCcw className="h-3.5 w-3.5" />
          Regenerate
        </button>
      )}
    </div>
  );
};

interface MessageBubbleProps {
  message: ChatMessage;
  isLastMessage?: boolean;
  streamingText?: string;
  actions?: MessageActions;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isLastMessage = false,
  streamingText,
  actions,
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

  const isUserMessage = message.sender === "user";
  const isStreaming = message.isStreaming || !!streamingText;
  const currentText = streamingText || message.text;

  // Inside a user bubble the background IS the teal accent, so every colour
  // there has to come from the bubble's own foreground: text-primary on
  // bg-primary is 1:1 (invisible). In answers, accent colour is kept for
  // links and code; headings and bold were teal too, which made every answer
  // a patchwork of highlights with nothing standing out.
  const tone = {
    body: isUserMessage ? "text-current" : "text-foreground",
    muted: isUserMessage ? "text-current opacity-90" : "text-muted-foreground",
    link: isUserMessage ? "text-current" : "text-primary",
  };

  const memoizedComponents = useMemo((): Components => ({
    // react-markdown 9 no longer passes `inline` to `code`, so every inline
    // `dp[i]` used to render as a full block with a header and copy button.
    // Fenced code is the only `code` inside a `pre`, so blocks are drawn here
    // and `code` itself is always inline.
    pre: ({ children }) => {
      const child = React.Children.toArray(children)[0];
      if (React.isValidElement(child)) {
        const props = child.props as { className?: string; children?: React.ReactNode };
        const language = /language-([\w+#-]+)/.exec(props.className || "")?.[1] ?? "text";
        return <CodeBlock language={language} code={String(props.children ?? "").replace(/\n$/, "")} />;
      }
      return <pre>{children}</pre>;
    },
    // A quiet tint, no border: wrapped across lines, a bordered pill broke
    // into two half-boxes. box-decoration-clone keeps both halves padded.
    code: ({ node, className, children, ...props }) => (
      <code
        className={`rounded px-1.5 py-0.5 font-mono text-[0.875em] [box-decoration-break:clone] ${isUserMessage
          ? 'bg-black/15 text-current'
          : 'bg-white/[0.08] text-foreground'
          } ${className ?? ""}`}
        {...props}
      >
        {children}
      </code>
    ),
    h1: ({ node, ...props }) => (
      <h1 className={`mt-6 mb-3 text-xl font-semibold first:mt-0 ${tone.body}`} {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className={`mt-6 mb-2 text-lg font-semibold first:mt-0 ${tone.body}`} {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className={`mt-5 mb-2 text-base font-semibold first:mt-0 ${tone.body}`} {...props} />
    ),
    h4: ({ node, ...props }) => (
      <h4 className={`mt-4 mb-1.5 text-base font-semibold first:mt-0 ${tone.body}`} {...props} />
    ),
    h5: ({ node, ...props }) => (
      <h5 className={`mt-3 mb-1.5 text-sm font-semibold first:mt-0 ${tone.body}`} {...props} />
    ),
    h6: ({ node, ...props }) => (
      <h6 className={`mt-3 mb-1.5 text-sm font-semibold first:mt-0 ${tone.muted}`} {...props} />
    ),
    p: ({ node, ...props }) => (
      <p className={`my-3 text-[15px] leading-7 first:mt-0 last:mb-0 ${tone.body}`} {...props} />
    ),
    ul: ({ node, ...props }) => (
      <ul className={`my-3 list-outside list-disc space-y-1.5 pl-5 text-[15px] leading-7 first:mt-0 last:mb-0 ${tone.body}`} {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className={`my-3 list-outside list-decimal space-y-1.5 pl-5 text-[15px] leading-7 first:mt-0 last:mb-0 ${tone.body}`} {...props} />
    ),
    li: ({ node, ...props }) => (
      <li className="pl-1 marker:text-muted-foreground" {...props} />
    ),
    a: ({ node, ...props }) => (
      <a
        className={`break-words font-medium underline underline-offset-2 ${tone.link}`}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
    strong: ({ node, ...props }) => (
      <strong className="font-semibold text-current" {...props} />
    ),
    em: ({ node, ...props }) => (
      <em className="italic" {...props} />
    ),
    blockquote: ({ node, ...props }) => (
      <blockquote className={`my-3 border-l-2 border-primary/50 pl-4 ${tone.muted}`} {...props} />
    ),
    hr: ({ node, ...props }) => (
      <hr className="my-5 border-border" {...props} />
    ),
    table: ({ node, ...props }) => (
      <div className="my-4 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm [&_tr:last-child_td]:border-b-0" {...props} />
      </div>
    ),
    thead: ({ node, ...props }) => (
      <thead className="bg-white/[0.04]" {...props} />
    ),
    // Left-aligned like the cells under them, and not shouted in capitals.
    th: ({ node, ...props }) => (
      <th className="border-b border-border px-3 py-2 text-left font-medium text-muted-foreground" {...props} />
    ),
    td: ({ node, ...props }) => (
      <td className={`border-b border-border px-3 py-2 align-top ${tone.body}`} {...props} />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [isUserMessage]);

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
      // Shown in full as soon as it arrives. Simple answers used to be typed
      // out again at 15ms a character after they had already arrived.
      return (
        <div className="max-w-none break-words">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={memoizedComponents}>
            {currentText}
          </ReactMarkdown>
          {isStreaming && (
            <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-primary" aria-hidden="true" />
          )}
        </div>
      );
    }

    return <span className="italic text-muted-foreground text-sm">(Empty message)</span>;
  };

  // A question asking for a choice has nothing worth copying.
  const showCopy = !message.askLanguage;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="group"
      >
        {isUserMessage ? (
          // The user's turn: a compact bubble on the right. No avatar or "YOU"
          // label; which side it is on already says who wrote it.
          <div className="flex justify-end">
            <div
              className="max-w-[85%] break-words rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground sm:max-w-[75%]"
              title={message.timestamp}
            >
              {renderContent()}
            </div>
          </div>
        ) : (
          // The tutor's turn: full column width, no card around it, so code
          // blocks and tables get the room and read as part of the page.
          <div className="flex gap-3">
            <div
              className="mt-0.5 hidden h-7 w-7 shrink-0 place-items-center rounded-full border border-primary/25 bg-primary/10 text-primary sm:grid"
              aria-hidden="true"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="sr-only">Tutor:</span>
              {renderContent()}
              {message.suggestions && message.suggestions.length > 0 && (
                <SuggestionChips suggestions={message.suggestions} onOpen={openSuggestion} />
              )}
              {message.askLanguage && isLastMessage && actions && !actions.busy && (
                <LanguageButtons onPick={actions.onQuickReply} />
              )}
              {!isStreaming && !message.isVisualization && (
                <div className="-ml-2.5 mt-1.5 flex flex-wrap items-center gap-x-1">
                  <AnswerActions
                    text={showCopy ? message.text : ""}
                    canRegenerate={isLastMessage && !!actions && actions.canRegenerate && !actions.busy}
                    onRegenerate={actions?.onRegenerate}
                  />
                  {message.stopped && (
                    <span className="px-2.5 text-xs text-muted-foreground">Stopped</span>
                  )}
                  <span className="px-2.5 text-xs text-muted-foreground">{message.timestamp}</span>
                </div>
              )}
            </div>
          </div>
        )}
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
