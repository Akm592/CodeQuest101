// ./src/components/chatbot/ChatInterface.tsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, MessageSquarePlus } from "lucide-react"; // Import icons
import ChatWindow from "./ChatWindow";
import TypingIndicator from "./TypingIndicator";
import { useAuth } from "../../contexts/AuthContext";
import ChatSidebar from "./ChatSidebar"; // Import ChatSidebar component

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  isVisualization?: boolean;
  visualizationData?: any;
}

interface ChatSessionInfo {
  id: string;
  session_name: string | null;
  created_at: string;
  updated_at: string;
}

const ChatInterface = () => {
  const { user, getChatSession, createChatSession } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const [chatSessions, setChatSessions] = useState<ChatSessionInfo[]>([]); // For sidebar sessions
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  ); // Track selected session

  // Fetch chat sessions for sidebar on mount and user change
  useEffect(() => {
    const fetchSessions = async () => {
      if (user) {
        try {
          const response = await axios.get("http://localhost:8000/sessions");
          console.log("Chat sessions:", response.data);
          setChatSessions(response.data);
        } catch (err) {
          console.error("Error fetching chat sessions:", err);
          setError("Failed to load chat sessions.");
        }
      } else {
        setChatSessions([]); // Clear sessions if no user
      }
    };
    fetchSessions();
  }, [user]);

  // Initialize chat session on mount if user is available
  useEffect(() => {
    const initChatSession = async () => {
      if (user) {
        try {
          setIsLoading(true);
          let sessionRecord = await getChatSession(); // Get latest session
          if (!sessionRecord) {
            sessionRecord = await createNewChatSession(); // Create if none exists
          }
          setSession(sessionRecord);
          setSelectedSessionId(sessionRecord.id); // Set selected session
          await loadMessageHistory(sessionRecord.id); // Load history for the initial session
        } catch (err) {
          console.error("Error initializing chat session", err);
          setError("Failed to initialize chat session.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    initChatSession();
  }, [user, getChatSession]);

  // Load message history when session changes (or on initial session load)
  useEffect(() => {
    if (selectedSessionId) {
      loadMessageHistory(selectedSessionId);
    } else {
      setMessages([]); // Clear messages if no session selected
    }
  }, [selectedSessionId]);

  const loadMessageHistory = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `http://localhost:8000/sessions/${sessionId}/messages`
      );
      const historyMessages = response.data.map((msg: any) => ({
        // Adjust mapping to match Message interface
        id: msg.id,
        sender: msg.sender_type,
        text: msg.content,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isVisualization: msg.visualization_data !== null,
        visualizationData: msg.visualization_data,
      }));
      setMessages(historyMessages);
    } catch (error) {
      console.error("Error loading message history:", error);
      setError("Failed to load message history.");
      setMessages([]); // Clear messages on error
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChatSession = async () => {
    try {
      const newSessionRecord = await createChatSession();
      localStorage.removeItem("chatSessionId"); // Clear old session ID if any
      setSession(newSessionRecord);
      setSelectedSessionId(newSessionRecord.id); // Select the new session
      setMessages([]); // Clear messages for the new session
      // Refresh session list for sidebar
      const response = await axios.get("http://localhost:8000/sessions");
      setChatSessions(response.data);
      return newSessionRecord; // Return for immediate use in initChatSession
    } catch (error) {
      console.error("Error creating new chat session:", error);
      setError("Failed to create new chat session.");
      throw error; // Re-throw to handle in initChatSession
    }
  };

  const handleNewChat = async () => {
    setIsLoading(true);
    try {
      const newSessionRecord = await createNewChatSession();
      setSession(newSessionRecord);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll chat window when new messages are added
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading || !session) return;
    setError(null);
    setIsLoading(true);
    setIsTyping(true);

    const userMessage: Message = {
      id: Date.now().toString() + "-user",
      sender: "user",
      text: trimmedInput,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    try {
      const response = await axios.post(
        "http://localhost:8000/chat",
        { user_input: trimmedInput },
        { headers: { "X-Session-ID": session.id } }
      );

      const {
        bot_response: botResponseText,
        response_type: responseType,
        visualization_data: visualizationData,
      } = response.data;

      const botMessage: Message = {
        id: Date.now().toString() + "-bot",
        sender: "bot",
        text: botResponseText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        ...(responseType === "visualization" && {
          isVisualization: true,
          visualizationData,
        }),
      };

      setTimeout(() => {
        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
      }, 600);
    } catch (apiError: any) {
      console.error("API Error:", apiError);
      setIsTyping(false);
      setError(apiError.message || "Failed to get response from AI.");
      const errorMessage: Message = {
        id: Date.now().toString() + "-error",
        sender: "bot",
        text: "Sorry, I encountered an error. Please try again later.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionSelect = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setSession({ id: sessionId }); // Update current session context to selected session
  };

  return (
    <div className="flex h-screen w-screen bg-gray-50">
      {/* Sidebar */}
      <ChatSidebar
        sessions={chatSessions}
        onSessionSelect={handleSessionSelect}
        selectedSessionId={selectedSessionId}
        onCreateNewSession={handleNewChat} // Pass handleNewChat to sidebar
      />
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 shadow-sm flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">AI Assistant</h1>
          <button
            onClick={handleNewChat}
            disabled={isLoading}
            className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <MessageSquarePlus className="w-5 h-5" /> {/* New Chat Icon */}
          </button>
        </header>
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 overflow-hidden flex">
          <div
            ref={chatWindowRef}
            className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col flex-1 min-h-0"
          >
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
              <AnimatePresence mode="popLayout">
                <ChatWindow messages={messages} />
              </AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 text-gray-500"
                >
                  <TypingIndicator />
                </motion.div>
              )}
            </div>
            <div className="border-t border-gray-200 p-3 md:p-4">
              <div className="max-w-4xl w-full mx-auto flex items-center space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && handleSendMessage()
                  }
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-100 rounded-full px-4 md:px-6 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed top-4 left-4 right-4 md:right-4 bg-red-50 text-red-500 px-4 py-2 rounded-lg shadow-sm border border-red-200"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default ChatInterface;
