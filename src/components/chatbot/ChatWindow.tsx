import React, { forwardRef, useMemo, useCallback, useRef, useEffect } from "react";
import { AnimatePresence, motion } from 'framer-motion';
import { FixedSizeList as VirtualList } from 'react-window';
import MessageBubble from "./MessageBubble";
import { AlertCircle } from "lucide-react";

interface Message {
    id: string;
    sender: "user" | "bot";
    text: string;
    timestamp: string;
    isVisualization?: boolean;
    visualizationData?: any;
}

interface ChatWindowProps {
    messages: Message[];
    isLoading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    enableVirtualization?: boolean;
    maxMessagesBeforeVirtualization?: number;
    className?: string;
    autoScroll?: boolean;
}

const ErrorMessage = React.memo(({ error, onRetry }: { error: string; onRetry?: () => void }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex items-center justify-center p-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg mx-4 my-2"
    >
        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
        <span className="text-sm mr-3">{error}</span>
        {onRetry && (
            <button
                onClick={onRetry}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
                Retry
            </button>
        )}
    </motion.div>
));
ErrorMessage.displayName = 'ErrorMessage';

const EmptyState = React.memo(() => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400"
    >
        <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                💬
            </div>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1 opacity-75">Start a conversation</p>
        </div>
    </motion.div>
));
EmptyState.displayName = 'EmptyState';

const VirtualizedMessageItem = React.memo<{
    index: number;
    style: React.CSSProperties;
    data: {
        messages: Message[];
        messagesCount: number;
    };
}>(({ index, style, data }) => {
    const { messages, messagesCount } = data;
    const message = messages[index];
    const isLastMessage = index === messagesCount - 1;

    if (!message) return null;

    return (
        <div style={style}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ duration: 0.3, ease: "easeOut", layout: { duration: 0.2 } }}
                layout
            >
                <MessageBubble message={message} isLastMessage={isLastMessage} />
            </motion.div>
        </div>
    );
});
VirtualizedMessageItem.displayName = 'VirtualizedMessageItem';

const MessageItem = React.memo<{
    message: Message;
    index: number;
    isLastMessage: boolean;
}>(({ message, index, isLastMessage }) => (
    <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95, height: 0, marginBottom: 0 }}
        transition={{
            duration: 0.4,
            ease: [0.4, 0.0, 0.2, 1],
            delay: Math.min(index * 0.05, 0.3),
            layout: { duration: 0.3 }
        }}
        layout
        className="mb-4 last:mb-0"
    >
        <MessageBubble message={message} isLastMessage={isLastMessage} />
    </motion.div>
));
MessageItem.displayName = 'MessageItem';

const ChatWindow = forwardRef<HTMLDivElement, ChatWindowProps>(({
    messages,
    isLoading = false,
    error = null,
    onRetry,
    enableVirtualization = false,
    maxMessagesBeforeVirtualization = 100,
    className = "",
    autoScroll = true
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const virtualListRef = useRef<VirtualList>(null);

    const memoizedMessages = useMemo(() => messages, [messages]);
    const messagesCount = useMemo(() => messages.length, [messages.length]);
    const shouldUseVirtualization = useMemo(() =>
        enableVirtualization && messagesCount > maxMessagesBeforeVirtualization,
        [enableVirtualization, messagesCount, maxMessagesBeforeVirtualization]
    );

    const virtualListData = useMemo(() => ({
        messages: memoizedMessages,
        messagesCount
    }), [memoizedMessages, messagesCount]);

    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        if (containerRef.current && autoScroll) {
            containerRef.current.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior
            });
        }
    }, [autoScroll]);

    useEffect(() => {
        if (shouldUseVirtualization && virtualListRef.current) {
            virtualListRef.current.scrollToItem(messagesCount - 1, 'end');
        } else {
            scrollToBottom();
        }
    }, [messagesCount, shouldUseVirtualization, scrollToBottom]);

    useEffect(() => {
        if (messagesCount > 0) {
            scrollToBottom('auto');
        }
    }, []);

    const combinedRef = useCallback((node: HTMLDivElement) => {
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
    }, [ref]);

    if (error) {
        return (
            <div ref={combinedRef} className={`flex items-center justify-center h-full ${className}`} role="alert" aria-live="polite">
                <ErrorMessage error={error} onRetry={onRetry} />
            </div>
        );
    }

    if (!isLoading && messagesCount === 0) {
        return (
            <div ref={combinedRef} className={`flex items-center justify-center h-full ${className}`} role="log" aria-live="polite" aria-label="Chat messages">
                <EmptyState />
            </div>
        );
    }

    if (shouldUseVirtualization) {
        return (
            <div ref={combinedRef} className={`h-full ${className}`} role="log" aria-live="polite" aria-label="Chat messages">
                <VirtualList
                    ref={virtualListRef}
                    height={containerRef.current?.clientHeight || 400}
                    width={containerRef.current?.clientWidth || '100%'}
                    itemCount={messagesCount}
                    itemSize={120} // Approximate item height
                    itemData={virtualListData}
                    overscanCount={5}
                    className="scrollbar-thin scrollbar-thumb-gray-400/50 dark:scrollbar-thumb-gray-600/50"
                >
                    {VirtualizedMessageItem}
                </VirtualList>
            </div>
        );
    }

    return (
        <div ref={combinedRef} className={`h-full ${className}`} role="log" aria-live="polite" aria-label="Chat messages">
            <AnimatePresence initial={false} mode="popLayout">
                {memoizedMessages.map((message, index) => (
                    <MessageItem
                        key={message.id}
                        message={message}
                        index={index}
                        isLastMessage={index === messagesCount - 1}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
});

ChatWindow.displayName = 'ChatWindow';

export default React.memo(ChatWindow);