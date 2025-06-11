import React, { useState, useRef, useEffect, useCallback, useMemo, useReducer } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, MessageSquarePlus, X, Settings, Sparkles, Lightbulb, Trash2 } from "lucide-react";
import ChatWindow from "./ChatWindow";
import TypingIndicator from "./TypingIndicator";
import { useAuth } from "../../contexts/AuthContext";
import ChatSidebar from "./ChatSidebar";
import SettingsModal from "./SettingsModal";
import { supabase } from "../../lib/supabaseClient";

// --- Interfaces ---
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

// --- State Management with Reducers ---
interface ChatState {
  messages: Message[];
  isTyping: boolean;
  isLoading: boolean;
  error: string | null;
  inputValue: string;
}

type ChatAction =
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<Message> } }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INPUT_VALUE'; payload: string }
  | { type: 'CLEAR_CHAT' };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id ? { ...msg, ...action.payload.updates } : msg
        )
      };
    case 'SET_TYPING':
      return { ...state, isTyping: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_INPUT_VALUE':
      return { ...state, inputValue: action.payload };
    case 'CLEAR_CHAT':
      return { ...state, messages: [], error: null };
    default:
      return state;
  }
};

interface SessionState {
  sessions: ChatSessionInfo[];
  selectedSessionId: string | null;
  session: any;
  isCreatingSession: boolean;
}

type SessionAction =
  | { type: 'SET_SESSIONS'; payload: ChatSessionInfo[] }
  | { type: 'ADD_SESSION'; payload: ChatSessionInfo }
  | { type: 'DELETE_SESSION'; payload: string }
  | { type: 'SET_SELECTED_SESSION'; payload: string | null }
  | { type: 'SET_SESSION'; payload: any }
  | { type: 'SET_CREATING_SESSION'; payload: boolean };

const sessionReducer = (state: SessionState, action: SessionAction): SessionState => {
  switch (action.type) {
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };
    case 'ADD_SESSION':
      return { ...state, sessions: [action.payload, ...state.sessions] };
    case 'DELETE_SESSION':
      return {
        ...state,
        sessions: state.sessions.filter(s => s.id !== action.payload)
      };
    case 'SET_SELECTED_SESSION':
      return { ...state, selectedSessionId: action.payload };
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    case 'SET_CREATING_SESSION':
      return { ...state, isCreatingSession: action.payload };
    default:
      return state;
  }
};

// --- Custom Hooks ---
const useTheme = () => {
  const [theme, setTheme] = useState<string>("system");

  const applyTheme = useCallback((newTheme: string) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
  }, []);

  const handleThemeChange = useCallback((newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  }, [applyTheme]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "system";
    setTheme(savedTheme);
    applyTheme(savedTheme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (savedTheme === "system") applyTheme("system");
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [applyTheme]);

  return { theme, handleThemeChange };
};

const useAPI = () => {
  const api = useMemo(() => axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  }), []);

  return api;
};

// --- SuggestionsScreen Component ---
const SuggestionsScreen = React.memo(({ onSuggestionClick }: { onSuggestionClick: (suggestion: string) => void }) => {
  const suggestions = [
    "Explain quicksort with a step-by-step example.",
    "Visualize a BFS traversal on a sample graph.",
    "Generate a linked list visualization for [1, 2, 3, 4].",
    "Explain the two-pointer technique with an example.",
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-800 dark:text-gray-100 p-4 sm:p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="text-center mb-8 sm:mb-10"
      >
        <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-blue-500 dark:text-blue-400 mb-4" />
        <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400">
          Welcome to AI Assistant
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">How can I help you today?</p>
      </motion.div>

      <div className="w-full max-w-3xl">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300 mb-5 flex items-center justify-center gap-2">
          <Lightbulb className="w-5 h-5" />
          <span>Try these suggestions:</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="bg-white/30 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10
                         text-gray-800 dark:text-gray-200 rounded-xl p-4 sm:p-5 text-left shadow-lg hover:shadow-xl
                         hover:bg-white/40 dark:hover:bg-black/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              onClick={() => onSuggestionClick(suggestion)}
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
});

SuggestionsScreen.displayName = 'SuggestionsScreen';

// --- Main ChatInterface Component ---
const ChatInterface = () => {
  // --- Hooks and Context ---
  const { user, getChatSession, createChatSession } = useAuth();
  const { theme, handleThemeChange } = useTheme();
  const api = useAPI();

  // --- State Management ---
  const [chatState, chatDispatch] = useReducer(chatReducer, {
    messages: [],
    isTyping: false,
    isLoading: false,
    error: null,
    inputValue: "",
  });

  const [sessionState, sessionDispatch] = useReducer(sessionReducer, {
    sessions: [],
    selectedSessionId: null,
    session: null,
    isCreatingSession: false,
  });

  // --- Local State ---
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // --- Refs ---
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // --- Memoized Values ---
  const apiLink = useMemo(() => import.meta.env.VITE_API_URL || "http://localhost:8000", []);

  // --- Memoized Handlers ---
  const handleSendMessage = useCallback(async (messageText?: string) => {
    const textToSend = (messageText || chatState.inputValue).trim();
    if (!textToSend || chatState.isLoading || !sessionState.session?.id) {
      if (!sessionState.session?.id) {
        chatDispatch({ type: 'SET_ERROR', payload: "No active chat session. Please start a new chat." });
      }
      return;
    }

    chatDispatch({ type: 'SET_ERROR', payload: null });

    const currentUserMessageId = `user-${Date.now()}-${Math.random()}`;
    const userMessage: Message = {
      id: currentUserMessageId,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    chatDispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    if (!messageText) {
      chatDispatch({ type: 'SET_INPUT_VALUE', payload: "" });
    }

    const botMessageId = `bot-${Date.now()}-${Math.random()}`;
    let accumulatedBotText = "";

    try {
      chatDispatch({ type: 'SET_TYPING', payload: true });

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const response = await fetch(`${apiLink}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": sessionState.session.id,
        },
        body: JSON.stringify({ user_input: textToSend }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown server error" }));
        throw new Error(`HTTP error ${response.status}: ${errorData.detail || response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get reader from response body");
      }

      const decoder = new TextDecoder();
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          chatDispatch({
            type: 'UPDATE_MESSAGE',
            payload: {
              id: botMessageId,
              updates: { timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
            }
          });
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        lines.forEach(line => {
          if (line.startsWith("data:")) {
            try {
              const jsonString = line.substring(5).trim();
              if (jsonString) {
                const data = JSON.parse(jsonString);

                if (data.type === "text") {
                  accumulatedBotText += data.content;

                  if (isFirstChunk) {
                    const newBotMessage: Message = {
                      id: botMessageId,
                      sender: "bot",
                      text: accumulatedBotText,
                      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      isVisualization: false,
                    };
                    chatDispatch({ type: 'ADD_MESSAGE', payload: newBotMessage });
                    isFirstChunk = false;
                  } else {
                    chatDispatch({
                      type: 'UPDATE_MESSAGE',
                      payload: { id: botMessageId, updates: { text: accumulatedBotText } }
                    });
                  }
                } else if (data.type === "visualization") {
                  const vizMessage: Message = {
                    id: `bot-viz-${Date.now()}`,
                    sender: "bot",
                    text: data.description || " ",
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    isVisualization: true,
                    visualizationData: data.data,
                  };
                  chatDispatch({ type: 'ADD_MESSAGE', payload: vizMessage });
                  accumulatedBotText = "";
                  isFirstChunk = true;
                }
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e, "Line:", line);
            }
          }
        });
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("API Error:", error);
        chatDispatch({ type: 'SET_ERROR', payload: error.message || "Failed to get response from the server." });

        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          sender: "bot",
          text: `Sorry, I encountered an error: ${error.message}. Please check the connection or try again later.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        chatDispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
      }
    } finally {
      chatDispatch({ type: 'SET_TYPING', payload: false });
      chatDispatch({ type: 'SET_LOADING', payload: false });
      abortControllerRef.current = null;
    }
  }, [chatState.inputValue, chatState.isLoading, sessionState.session?.id, apiLink]);

  const handleSessionSelect = useCallback(async (sessionId: string) => {
    if (sessionId === sessionState.selectedSessionId) return;

    sessionDispatch({ type: 'SET_SELECTED_SESSION', payload: sessionId });
    sessionDispatch({ type: 'SET_SESSION', payload: { id: sessionId } });

    try {
      chatDispatch({ type: 'SET_LOADING', payload: true });
      chatDispatch({ type: 'SET_ERROR', payload: null });

      const response = await api.get(`/sessions/${sessionId}/messages`);
      const historyMessages: Message[] = (response.data || []).map((msg: any) => ({
        id: msg.id || `fallback-${Math.random()}`,
        sender: msg.sender_type === 'user' || msg.sender_type === 'bot' ? msg.sender_type : 'bot',
        text: msg.content || "",
        timestamp: msg.created_at
          ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isVisualization: msg.visualization_data !== null && msg.visualization_data !== undefined,
        visualizationData: msg.visualization_data,
      }));

      chatDispatch({ type: 'SET_MESSAGES', payload: historyMessages });
    } catch (error: any) {
      console.error("Error loading message history:", error);
      if (error.response?.status === 404) {
        chatDispatch({ type: 'SET_ERROR', payload: `Chat session (${sessionId}) not found. It might have been deleted.` });
        sessionDispatch({ type: 'SET_SELECTED_SESSION', payload: null });
        sessionDispatch({ type: 'SET_SESSION', payload: null });
        chatDispatch({ type: 'SET_MESSAGES', payload: [] });
      } else {
        chatDispatch({ type: 'SET_ERROR', payload: "Failed to load message history. Please try again." });
      }
    } finally {
      chatDispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [sessionState.selectedSessionId, api]);

  const handleNewChat = useCallback(async () => {
    if (sessionState.isCreatingSession) return;

    try {
      sessionDispatch({ type: 'SET_CREATING_SESSION', payload: true });
      chatDispatch({ type: 'SET_LOADING', payload: true });

      const newSessionRecord = await createChatSession();

      if (!newSessionRecord?.id) {
        throw new Error("Failed to create session record");
      }

      sessionDispatch({ type: 'SET_SESSION', payload: newSessionRecord });
      sessionDispatch({ type: 'SET_SELECTED_SESSION', payload: newSessionRecord.id });
      chatDispatch({ type: 'CLEAR_CHAT' });

      // Refresh sessions list
      if (user) {
        const { data: updatedSessions, error: fetchError } = await supabase
          .from("chat_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order('created_at', { ascending: false });

        if (!fetchError) {
          sessionDispatch({ type: 'SET_SESSIONS', payload: updatedSessions || [] });
        }
      }

    } catch (error) {
      console.error("Error creating new chat session:", error);
      chatDispatch({ type: 'SET_ERROR', payload: "Failed to create a new chat session. Please try again." });
    } finally {
      sessionDispatch({ type: 'SET_CREATING_SESSION', payload: false });
      chatDispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [sessionState.isCreatingSession, createChatSession, user]);

  const handleDeleteSession = useCallback(async () => {
    if (!sessionToDelete || !user) return;

    try {
      const originalSessions = [...sessionState.sessions];
      sessionDispatch({ type: 'DELETE_SESSION', payload: sessionToDelete });
      setShowDeleteConfirm(false);

      const { error: deleteError } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", sessionToDelete);

      if (deleteError) {
        sessionDispatch({ type: 'SET_SESSIONS', payload: originalSessions });
        chatDispatch({ type: 'SET_ERROR', payload: "Failed to delete session." });
      } else {
        if (sessionState.selectedSessionId === sessionToDelete) {
          const remainingSessions = originalSessions.filter(s => s.id !== sessionToDelete);
          if (remainingSessions.length > 0) {
            handleSessionSelect(remainingSessions[0].id);
          } else {
            await handleNewChat();
          }
        }
      }
    } catch (error) {
      console.error("Error during session deletion:", error);
      chatDispatch({ type: 'SET_ERROR', payload: "An unexpected error occurred while deleting session." });
    } finally {
      setShowDeleteConfirm(false);
      setSessionToDelete(null);
    }
  }, [sessionToDelete, user, sessionState.sessions, sessionState.selectedSessionId, handleSessionSelect, handleNewChat]);

  // --- Effects ---
  useEffect(() => {
    const fetchSessions = async () => {
      if (user) {
        try {
          const { data: fetchedSessions, error: fetchError } = await supabase
            .from("chat_sessions")
            .select("*")
            .eq("user_id", user.id)
            .order('created_at', { ascending: false });

          if (fetchError) {
            console.error("Error fetching chat sessions:", fetchError);
            chatDispatch({ type: 'SET_ERROR', payload: "Failed to load chat sessions." });
          } else {
            sessionDispatch({ type: 'SET_SESSIONS', payload: fetchedSessions || [] });
          }
        } catch (err) {
          console.error("Error fetching chat sessions:", err);
          chatDispatch({ type: 'SET_ERROR', payload: "Failed to load chat sessions." });
        }
      } else {
        sessionDispatch({ type: 'SET_SESSIONS', payload: [] });
      }
    };
    fetchSessions();
  }, [user]);

  useEffect(() => {
    const initChatSession = async () => {
      if (user) {
        try {
          chatDispatch({ type: 'SET_LOADING', payload: true });
          let sessionRecord = await getChatSession();

          if (!sessionRecord) {
            const { data: existingSessions } = await supabase
              .from("chat_sessions")
              .select("id")
              .eq("user_id", user.id)
              .order('created_at', { ascending: false })
              .limit(1);

            sessionRecord = (existingSessions?.[0]) ? await getChatSession() : await createChatSession();
          }

          if (sessionRecord) {
            sessionDispatch({ type: 'SET_SESSION', payload: sessionRecord });
            sessionDispatch({ type: 'SET_SELECTED_SESSION', payload: sessionRecord.id });
            await handleSessionSelect(sessionRecord.id);
          } else {
            throw new Error("Failed to get or create a session.");
          }

        } catch (err) {
          console.error("Error initializing chat session", err);
          chatDispatch({ type: 'SET_ERROR', payload: "Failed to initialize chat session." });
        } finally {
          chatDispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        sessionDispatch({ type: 'SET_SESSION', payload: null });
        sessionDispatch({ type: 'SET_SELECTED_SESSION', payload: null });
        chatDispatch({ type: 'SET_MESSAGES', payload: [] });
      }
    };

    initChatSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, getChatSession, createChatSession]);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTo({
        top: chatWindowRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatState.messages, chatState.isTyping]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-gradient-to-br from-gray-100 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-800">
      <ChatSidebar
        sessions={sessionState.sessions}
        onSessionSelect={handleSessionSelect}
        selectedSessionId={sessionState.selectedSessionId}
        onCreateNewSession={handleNewChat}
        onDeleteSession={(sessionId) => {
          setSessionToDelete(sessionId);
          setShowDeleteConfirm(true);
        }}
        isCreatingSession={sessionState.isCreatingSession}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden p-2 sm:p-3">
        <header className="bg-white/20 dark:bg-slate-900/40 backdrop-blur-xl border-b border-white/10 dark:border-white/5 rounded-t-2xl px-4 py-3 shadow-md flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-medium text-gray-800 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              AI Assistant
            </h1>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={handleNewChat}
              disabled={sessionState.isCreatingSession}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 
                        text-white rounded-lg sm:rounded-xl px-2 sm:px-3 py-2 flex items-center justify-center space-x-1
                        hover:from-blue-600 hover:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700
                        focus:outline-none focus:ring-2 focus:ring-blue-400/50 dark:focus:ring-blue-500/50
                        shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="New Chat"
              title="New Conversation"
            >
              {sessionState.isCreatingSession ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MessageSquarePlus className="w-5 h-5" />
              )}
              <span className="hidden sm:inline font-medium text-sm">New Chat</span>
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-lg sm:rounded-xl text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-colors duration-200"
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex justify-center items-center">
          <div className="bg-white/20 dark:bg-slate-900/40 backdrop-blur-xl border-x border-b border-white/10 dark:border-white/5 rounded-b-2xl shadow-xl flex flex-col h-full w-full min-h-0">
            <div
              ref={chatWindowRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin scrollbar-thumb-gray-400/50 dark:scrollbar-thumb-gray-600/50 scrollbar-track-transparent scrollbar-thumb-rounded-full hover:scrollbar-thumb-gray-500/60 dark:hover:scrollbar-thumb-gray-500/60"
            >
              <AnimatePresence mode="wait">
                {chatState.isLoading && chatState.messages.length === 0 ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center h-full"
                  >
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500 dark:text-blue-400" />
                  </motion.div>
                ) : !chatState.isLoading && chatState.messages.length === 0 ? (
                  <motion.div
                    key="suggestions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full"
                  >
                    <SuggestionsScreen onSuggestionClick={handleSendMessage} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full"
                  >
                    <ChatWindow
                      messages={chatState.messages}
                      isLoading={chatState.isTyping}
                      error={chatState.error}
                      onRetry={() => chatDispatch({ type: 'SET_ERROR', payload: null })}
                      enableVirtualization={chatState.messages.length > 100}
                    />
                    {chatState.isTyping && <TypingIndicator />}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-white/10 dark:border-white/5 p-3 sm:p-4 mt-auto flex-shrink-0">
              <div className="w-full flex items-end space-x-2 bg-white/30 dark:bg-black/20 backdrop-blur-md border border-white/10 dark:border-white/5 rounded-full shadow-inner px-2 sm:px-4 py-2 sm:py-3">
                <textarea
                  ref={(el) => {
                    if (el) {
                      el.style.height = "auto";
                      const maxHeight = 120;
                      const scrollHeight = el.scrollHeight;
                      el.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
                      el.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
                    }
                  }}
                  value={chatState.inputValue}
                  onChange={(e) => chatDispatch({ type: 'SET_INPUT_VALUE', payload: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !chatState.isTyping) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Send a message..."
                  rows={1}
                  className="flex-1 bg-transparent focus:outline-none text-sm placeholder-gray-500 dark:placeholder-gray-400 text-gray-800 dark:text-gray-100 resize-none scrollbar-thin ml-1"
                  disabled={chatState.isTyping || (!sessionState.session?.id)}
                  style={{
                    maxHeight: "120px",
                    border: "none",
                    boxShadow: "none"
                  }}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={chatState.isTyping || !chatState.inputValue.trim() || (!sessionState.session?.id)}
                  className={`bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 
                                text-white rounded-full p-2 sm:p-2.5 hover:from-blue-600 hover:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700 
                                focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2
                                dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed 
                                transition-all duration-200 ${chatState.inputValue.trim() ? 'opacity-100' : 'opacity-50'}`}
                  aria-label="Send message"
                >
                  {chatState.isTyping ? (
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
          {chatState.error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              className="fixed top-5 left-1/2 -translate-x-1/2 w-auto max-w-md bg-red-100/80 dark:bg-red-900/80 backdrop-blur-sm text-red-700 dark:text-red-200 px-4 py-3 rounded-lg shadow-lg border border-red-300 dark:border-red-700 z-50 flex items-center justify-between space-x-4"
              role="alert"
            >
              <span>{chatState.error}</span>
              <button
                onClick={() => chatDispatch({ type: 'SET_ERROR', payload: null })}
                className="text-red-500 dark:text-red-300 hover:text-red-700 dark:hover:text-red-100 p-1 rounded-full hover:bg-red-200/50 dark:hover:bg-red-800/50"
                aria-label="Close error message"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-white/10 p-6 rounded-xl shadow-2xl max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-full">
                    <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-center text-gray-800 dark:text-gray-100 mb-2">Delete Chat Session?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                  Are you sure you want to permanently delete this chat? This action cannot be undone.
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-5 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteSession}
                    className="px-5 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSettingsModal && (
            <SettingsModal
              currentTheme={theme}
              onThemeChange={handleThemeChange}
              onClose={() => setShowSettingsModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default React.memo(ChatInterface);