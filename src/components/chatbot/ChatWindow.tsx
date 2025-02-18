// src/components/chatbot/ChatWindow.tsx
import React from "react";
import MessageBubble from "./MessageBubble";
import { Message } from "./chatBot"; // Import Message interface from ChatInterface

interface ChatWindowProps {
  messages: Message[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  return (
    <>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </>
  );
};

export default ChatWindow;
