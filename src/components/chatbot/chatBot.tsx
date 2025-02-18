// src/components/chatbot/chatBot.tsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import InputArea from "./InputArea";
import ChatWindow from "./ChatWindow";
import TypingIndicator from "./TypingIndicator";
import AlgorithmVisualizer from "../Visualizer/AlgorithmVisualizer"; // Updated import path if both files are in the same folder

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  isVisualization?: boolean; // Flag to indicate if message is a visualization
  visualizationData?: any; // Data for visualization
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;

    setError(null);
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
    setInputValue("");

    try {
      const response = await axios.post("http://localhost:8000/chat", {
        user_input: trimmedInput,
      });
      const responseData = response.data;
      const botResponseText = responseData.bot_response;
      const responseType = responseData.response_type;
      const visualizationData = responseData.visualization_data;

      let botMessage: Message;
      if (responseType === "visualization" && visualizationData) {
        botMessage = {
          id: Date.now().toString() + "-bot",
          sender: "bot",
          text: botResponseText, // You might want a custom message here
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isVisualization: true,
          visualizationData: visualizationData,
        };
      } else {
        botMessage = {
          id: Date.now().toString() + "-bot",
          sender: "bot",
          text: botResponseText,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      }

      // Simulate bot "typing" delay before adding the bot message
      setTimeout(() => {
        setMessages((prevMessages) => [...prevMessages, botMessage]);
        setIsTyping(false);
      }, 700);
    } catch (apiError: any) {
      console.error("API Error:", apiError);
      setIsTyping(false);
      setError(apiError.message || "Failed to get response from AI.");
      const errorBotMessage: Message = {
        id: Date.now().toString() + "-error",
        sender: "bot",
        text: "Sorry, I encountered an error. Please try again later.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prevMessages) => [...prevMessages, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
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

// The MessageBubble component is defined here if you want to use it inside ChatWindow.
// Ensure that ChatWindow renders each message with MessageBubble.
export const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUserMessage = message.sender === "user";
  const bubbleClassName = isUserMessage
    ? "bg-blue-500 text-white ml-auto rounded-bl-none"
    : "bg-gray-300 text-gray-800 rounded-br-none";
  const containerClassName = isUserMessage ? "items-end" : "items-start";

  return (
    <motion.div
      className={`flex flex-col ${containerClassName} max-w-2xl`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`p-3 ${bubbleClassName} rounded-xl mb-1`}>
        {message.isVisualization ? (
          <AlgorithmVisualizer visualizationData={message.visualizationData} />
        ) : (
          message.text
        )}
      </div>
      <span className="text-gray-500 text-xs self-end">
        {message.timestamp}
      </span>
    </motion.div>
  );
};

export default ChatInterface;
