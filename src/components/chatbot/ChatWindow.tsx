// ChatWindow.tsx
import React, { forwardRef } from "react";
import MessageBubble from "./MessageBubble";
import { Message } from "./chatBot"; // Import the Message interface

interface ChatWindowProps {
  messages: Message[];
}

const ChatWindow = forwardRef<HTMLDivElement, ChatWindowProps>(
  ({ messages }, ref) => {
    return (
      <div ref={ref}>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
    );
  }
);

export default ChatWindow;
