// ./src/components/chatbot/ChatWindow.tsx
import { forwardRef } from "react";
import MessageBubble from "./MessageBubble";



interface Message {
    id: string;
    sender: "user" | "bot";
    text: string;
    timestamp: string;
    isVisualization?: boolean;
    visualizationData?: any;
  }
  
  // Import the Message interface

interface ChatWindowProps {
    messages: Message[];
}

const ChatWindow = forwardRef<HTMLDivElement, ChatWindowProps>(({ messages }, ref) => {
    return (
        <div ref={ref} className="space-y-4">
            {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
            ))}
        </div>
    );
});

export default ChatWindow;