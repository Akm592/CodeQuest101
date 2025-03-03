// ./src/components/chatbot/ChatInterface.tsx

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, MessageSquarePlus, Menu, X } from "lucide-react"; // Added Menu and X icons
import ChatWindow from "./ChatWindow";
import TypingIndicator from "./TypingIndicator";
import { useAuth } from "../../contexts/AuthContext";
import ChatSidebar from "./ChatSidebar";
import { supabase } from "../../lib/supabaseClient";

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
  const [chatSessions, setChatSessions] = useState<ChatSessionInfo[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile sidebar toggle
  const api = axios.create({
    baseURL:import.meta.env.VITE_API_URL || "http://localhost:8000",
  });

  // Fetch chat sessions for sidebar on mount and user change
  useEffect(() => {
    const fetchSessions = async () => {
      if (user) {
        try {
          const { data: chatSessions, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', user.id);

          if (error) {
            console.error("Error fetching chat sessions:", error);
            setError("Failed to load chat sessions.");
          } else {
            setChatSessions(chatSessions);
          }
        } catch (err) {
          console.error("Error fetching chat sessions:", err);
          setError("Failed to load chat sessions.");
        }
      } else {
        setChatSessions([]);
      }
    };
    fetchSessions();
  }, [user]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        sidebarOpen &&
        !target.closest('.sidebar') &&
        !target.closest('.sidebar-toggle-btn')
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  // Initialize chat session on mount if user is available
  useEffect(() => {
    const initChatSession = async () => {
      if (user) {
        try {
          setIsLoading(true);
          let sessionRecord = await getChatSession();
          if (!sessionRecord) {
            sessionRecord = await createNewChatSession();
          }
          setSession(sessionRecord);
          setSelectedSessionId(sessionRecord.id);
          await loadMessageHistory(sessionRecord.id);
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

  // Load message history when session changes
  useEffect(() => {
    if (selectedSessionId) {
      loadMessageHistory(selectedSessionId);
      // Close sidebar on mobile after selecting a session
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    } else {
      setMessages([]);
    }
  }, [selectedSessionId]);

  const loadMessageHistory = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/sessions/${sessionId}/messages`);
      const historyMessages = response.data.map((msg: any) => ({
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
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChatSession = async () => {
    try {
      const newSessionRecord = await createChatSession();
      localStorage.removeItem("chatSessionId");
      setSession(newSessionRecord);
      setSelectedSessionId(newSessionRecord.id);
      setMessages([]);
      const response = await api.get("/sessions");
      setChatSessions(response.data);
      return newSessionRecord;
    } catch (error) {
      console.error("Error creating new chat session:", error);
      setError("Failed to create new chat session.");
      throw error;
    }
  };

  const handleNewChat = async () => {
    setIsLoading(true);
    try {
      const newSessionRecord = await createNewChatSession();
      setSession(newSessionRecord);
      // Close sidebar on mobile after creating a new chat
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
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
      const response = await api.post(
        "/chat",
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
    setSession({ id: sessionId });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-30 z-20" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar - Hidden by default on mobile, visible on toggle */}
      <div
        className={`sidebar fixed md:relative z-30 h-full transition-all duration-300 ease-in-out transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } md:flex md:flex-shrink-0`}
      >
        <ChatSidebar
          sessions={chatSessions}
          onSessionSelect={handleSessionSelect}
          selectedSessionId={selectedSessionId}
          onCreateNewSession={handleNewChat}
        />
      </div>

      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {/* Sidebar Toggle Button for Mobile */}
            <button
              onClick={toggleSidebar}
              className="sidebar-toggle-btn md:hidden text-gray-700 hover:text-gray-900 focus:outline-none"
              aria-label="Toggle Sidebar"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="text-xl font-semibold text-gray-800">AI Assistant</h1>
          </div>
          <button
            onClick={handleNewChat}
            disabled={isLoading}
            className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="New Chat"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 md:px-6 overflow-hidden flex">
          <div
            className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col flex-1 min-h-0 w-full my-3"
          >
            <div
              ref={chatWindowRef}
              className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4"
            >
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

            <div className="border-t border-gray-200 p-3 sm:p-4">
              <div className="w-full flex items-center space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-blue-600 text-white rounded-full p-2 sm:p-3 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Send message"
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
        </main>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-4 left-4 right-4 md:w-auto md:max-w-md md:mx-auto bg-red-50 text-red-500 px-4 py-2 rounded-lg shadow-sm border border-red-200 z-50"
            >
              {error}
              <button 
                onClick={() => setError(null)}
                className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                aria-label="Close error message"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatInterface;