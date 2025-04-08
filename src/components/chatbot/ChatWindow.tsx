// ChatWindow.tsx
import { forwardRef } from "react";
import MessageBubble from "./MessageBubble";
import { AnimatePresence } from 'framer-motion'; // Import AnimatePresence

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
}

const ChatWindow = forwardRef<HTMLDivElement, ChatWindowProps>(({ messages }) => {
    return (
        // Removed outer div, rely on parent's padding/spacing
        // Apply AnimatePresence here to animate individual messages
        <AnimatePresence initial={false}>
             {messages.map((message, index) => (
                <MessageBubble
                    key={message.id} // Use message ID as key
                    message={message}
                    isLastMessage={index === messages.length - 1} // Pass if it's the last message for potential styling
                />
            ))}
        </AnimatePresence>
    );
});

export default ChatWindow;