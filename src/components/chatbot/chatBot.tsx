// src/components/chatbot/chatBot.tsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import InputArea from "./InputArea";
import ChatWindow from "./ChatWindow";
import TypingIndicator from "./TypingIndicator";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) {
      return; // Prevent sending empty messages
    }

    setError(null); // Clear any previous errors
    setIsLoading(true);
    setIsTyping(true);

    const newMessage: Message = {
      id: Date.now().toString() + "-user",
      sender: "user",
      text: trimmedInput,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputValue(""); // Clear input field after sending

    try {
      const response = await axios.post("http://localhost:8000/chat", {
        user_input: trimmedInput,
      }); // Backend API endpoint
      const botResponseText = response.data.bot_response;
      const botMessage: Message = {
        id: Date.now().toString() + "-bot",
        sender: "bot",
        text: botResponseText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setTimeout(() => {
        // Simulate bot typing delay for better UX
        setMessages((prevMessages) => [...prevMessages, botMessage]);
        setIsTyping(false);
      }, 700); // Adjust delay as needed
    } catch (apiError: any) {
      console.error("API Error:", apiError);
      setIsTyping(false);
      setError(
        apiError.message || "Failed to get response from AI. Please try again."
      );
      const errorBotMessage: Message = {
        id: Date.now().toString() + "-error",
        sender: "bot",
        text: "Sorry, I encountered an error. Please try again later.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prevMessages) => [...prevMessages, errorBotMessage]); // Add error message to chat
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // Send message on Enter, not Shift+Enter (for new lines in input if needed)
      e.preventDefault(); // Prevent default newline behavior in input
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 w-screen">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-semibold">AI Chatbot</h1>
      </header>

      <div
        id="chat-window"
        ref={chatWindowRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        <ChatWindow messages={messages} />
        {isTyping && <TypingIndicator />}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-red-500 text-sm mt-2"
          >
            {error}
          </motion.div>
        )}
      </div>

      <InputArea
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onSendMessage={handleSendMessage}
        onKeyDown={handleKeyDown}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ChatInterface;
