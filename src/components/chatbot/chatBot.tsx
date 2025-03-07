import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, MessageSquarePlus, Menu, X } from "lucide-react";
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

/** SuggestionsScreen Component */
const SuggestionsScreen = ({ onSuggestionClick }: { onSuggestionClick: (suggestion: string) => void }) => {
  const suggestions = [
    "Explain quicksort with a step-by-step example.",
    "Visualize a BFS traversal on a sample graph.",
    "Generate a linked list visualization for [1, 2, 3, 4].",
    "Explain the two-pointer technique with an example."
  ];
  

  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-800">
      <h2 className="text-3xl font-bold mb-6">Welcome to AI Assistant</h2>
      <p className="text-gray-500 mb-8 text-lg">Get started with these suggestions:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full px-4">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gray-100 text-gray-700 rounded-lg p-4 text-left hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm"
            onClick={() => onSuggestionClick(suggestion)}
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

/** ChatInterface Component */
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  });

  // Fetch chat sessions for sidebar on mount and user change
  useEffect(() => {
    const fetchSessions = async () => {
      if (user) {
        try {
          const { data: chatSessions, error } = await supabase
            .from("chat_sessions")
            .select("*")
            .eq("user_id", user.id);

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
        !target.closest(".sidebar") &&
        !target.closest(".sidebar-toggle-btn")
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend || isLoading || !session) return;

    // Reset states
    setError(null);
    setIsLoading(true);
    setIsTyping(true);

    // Add user's message to the chat
    const userMessage: Message = {
      id: Date.now().toString() + "-user",
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Clear input field only if message was sent from input
    if (!messageText) {
      setInputValue("");
    }

    try {
      // Send POST request to /chat endpoint
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": session.id,
        },
        body: JSON.stringify({ user_input: textToSend }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get reader from response body");
      }

      let botMessage: Message = {
        id: Date.now().toString() + "-bot",
        sender: "bot",
        text: "",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          setIsTyping(false);
          break;
        }

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            if (data.type === "text") {
              botMessage.text += data.content;
              setMessages((prev) => {
                const updatedMessages = prev.filter((msg) => msg.id !== botMessage.id);
                return [...updatedMessages, { ...botMessage }];
              });
            }
          }
        }
      }
    } catch (error: any) {
      console.error("API Error:", error);
      setIsTyping(false);
      setError(error.message || "Failed to get response from the server.");

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
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-30 z-20"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col flex-1 min-h-0 w-full my-3">
            <div
              ref={chatWindowRef}
              className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent hover:scrollbar-thumb-gray-700"
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center h-full"
                  >
                    <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                  </motion.div>
                ) : messages.length === 0 ? (
                  <motion.div
                    key="suggestions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <SuggestionsScreen onSuggestionClick={handleSendMessage} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <ChatWindow messages={messages} />
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center space-x-2 text-gray-500"
                      >
                        <TypingIndicator />
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-gray-200 p-3 sm:p-4">
              <div className="w-full flex items-end space-x-2 hide-scrollbar">
                <textarea
                  ref={(el) => {
                    if (el) {
                      el.style.height = "auto";
                      el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
                    }
                  }}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  rows={1}
                  className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none overflow-y-auto hide-scrollbar"
                  disabled={isLoading}
                  style={{ maxHeight: "150px" }}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-blue-600 text-white rounded-full p-2 sm:p-3 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-1"
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