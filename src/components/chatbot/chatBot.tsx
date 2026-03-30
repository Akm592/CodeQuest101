import React, { useState, useRef, useEffect, useCallback, useMemo, useReducer } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, MessageSquarePlus, X, Settings, Sparkles } from "lucide-react";
import ChatWindow from "./ChatWindow";
import TypingIndicator from "./TypingIndicator";
import { useAuth } from "../../contexts/AuthContext";
import ChatSidebar from "./ChatSidebar";
import SettingsModal from "./SettingsModal";
import DeleteSessionModal from "./DeleteSessionModal";
import { supabase } from "../../lib/supabaseClient";
import SuggestionsScreen from "./SuggestionsScreen";

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

// Guest sessions are ephemeral - no localStorage persistence

// --- SuggestionsScreen Component ---

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

      let newSessionRecord;

      if (user) {
        newSessionRecord = await createChatSession();
      } else {
        // Guest mode: Generate UUID locally (ephemeral, no DB persistence)
        const sessionId = crypto.randomUUID();
        newSessionRecord = {
          id: sessionId,
          session_name: "Guest Chat",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        // For guests, just keep the single active session in state (ephemeral)
        sessionDispatch({ type: 'SET_SESSIONS', payload: [newSessionRecord] });
      }

      if (!newSessionRecord?.id) {
        throw new Error("Failed to create session record");
      }

      sessionDispatch({ type: 'SET_SESSION', payload: newSessionRecord });
      sessionDispatch({ type: 'SET_SELECTED_SESSION', payload: newSessionRecord.id });
      chatDispatch({ type: 'CLEAR_CHAT' });

      // Refresh sessions list (User only)
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
        // Guest mode: Sessions are ephemeral, start with empty list
        // A session will be created when user initiates chat
        sessionDispatch({ type: 'SET_SESSIONS', payload: [] });
      }
    };
    fetchSessions();
  }, [user]);

  useEffect(() => {
    const initChatSession = async () => {
      // Logic for User
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
            // Fallback if truly failed
            throw new Error("Failed to get session");
          }

        } catch (err) {
          console.error("Error initializing chat session", err);
          chatDispatch({ type: 'SET_ERROR', payload: "Failed to initialize chat session." });
        } finally {
          chatDispatch({ type: 'SET_LOADING', payload: false });
        }
      }
      // Logic for Guest
      else {
        try {
          chatDispatch({ type: 'SET_LOADING', payload: true });
          // Guest sessions are ephemeral - auto-create one for smoother UX
          await handleNewChat();
        } catch (err) {
          console.error("Guest init error", err);
        } finally {
          chatDispatch({ type: 'SET_LOADING', payload: false });
        }
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
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-gray-50 dark:bg-[#050a14] relative transition-colors duration-300">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-teal-500/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

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

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">

        {/* Floating Header */}
        <header className="absolute top-4 left-4 right-4 z-20 mx-auto max-w-5xl bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 flex justify-between items-center shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-teal-500/10 border border-teal-500/20">
              <Sparkles className="w-4 h-4 text-teal-400" />
            </div>
            <h1 className="text-sm font-semibold text-white tracking-wide">
              AI ARCHITECT <span className="text-white/40 font-normal ml-2">| v2.0</span>
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-gray-400">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>System Online</span>
            </div>

            <button
              onClick={handleNewChat}
              disabled={sessionState.isCreatingSession}
              className="group p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-50"
              title="New Chat"
            >
              {sessionState.isCreatingSession ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MessageSquarePlus className="w-5 h-5 group-hover:text-teal-400 transition-colors" />
              )}
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="group p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              title="Settings"
            >
              <Settings className="w-5 h-5 group-hover:text-teal-400 transition-colors" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex justify-center items-center pt-20 pb-4 px-4">
          <div className="flex flex-col h-full w-full max-w-5xl mx-auto">
            <div
              ref={chatWindowRef}
              className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-teal-500/50"
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
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-teal-500/20 border-t-teal-500 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-teal-500 animate-pulse" />
                      </div>
                    </div>
                  </motion.div>
                ) : !chatState.isLoading && chatState.messages.length === 0 ? (
                  <motion.div
                    key="suggestions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full flex items-center justify-center"
                  >
                    <SuggestionsScreen onSuggestionClick={handleSendMessage} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col space-y-6 pb-4" // Added padding bottom to avoid cut-off
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

            {/* Floating Input Area */}
            <div className="p-4 pt-2">
              <div className="relative bg-[#0F1117]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl focus-within:border-teal-500/50 focus-within:ring-1 focus-within:ring-teal-500/50 transition-all duration-300">
                <textarea
                  ref={(el) => {
                    if (el) {
                      el.style.height = "auto";
                      const maxHeight = 150;
                      const scrollHeight = el.scrollHeight;
                      el.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
                      el.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden'; // Only show scroll if needed
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
                  placeholder="Ask anything about code..."
                  rows={1}
                  className="w-full bg-transparent text-gray-200 placeholder-gray-500 px-5 py-4 pr-14 focus:outline-none resize-none scrollbar-thin scrollbar-thumb-white/10 rounded-2xl min-h-[56px] text-base leading-relaxed"
                  disabled={chatState.isTyping || (!sessionState.session?.id)}
                />

                <div className="absolute bottom-2 right-2">
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={chatState.isTyping || !chatState.inputValue.trim() || (!sessionState.session?.id)}
                    className="p-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                  >
                    {chatState.isTyping ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="text-center mt-3">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-medium">
                  Powered by Advanced AI • Capable of Mistakes
                </p>
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
              className="absolute top-20 left-1/2 -translate-x-1/2 w-auto max-w-md bg-red-500/10 backdrop-blur-md border border-red-500/50 text-red-200 px-4 py-3 rounded-lg shadow-xl z-50 flex items-center gap-3"
            >
              <span>{chatState.error}</span>
              <button
                onClick={() => chatDispatch({ type: 'SET_ERROR', payload: null })}
                className="text-red-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <DeleteSessionModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteSession}
        />

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