import React, { useState, useRef, useEffect, useCallback, useReducer } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, MessageSquarePlus, X, Settings, Sparkles, CloudOff, PanelLeft } from "lucide-react";
import ChatWindow from "./ChatWindow";
import TypingIndicator from "./TypingIndicator";
import { useAuth } from "../../contexts/AuthContext";
import ChatSidebar from "./ChatSidebar";
import SettingsModal from "./SettingsModal";
import DeleteSessionModal from "./DeleteSessionModal";
import { supabase } from "../../lib/supabaseClient";
import { api, postChatStream, PendingContext } from "../../lib/api";
import { isNearBottom } from "../../lib/scroll";
import { v4 as uuidv4 } from "uuid";
import SuggestionsScreen from "./SuggestionsScreen";
import { buildVizContext, type ChatMessage } from "./types";
import { createSseParser } from "../../lib/chatStream";
import { parseSuggestions } from "../../lib/scene/validate";

// --- Interfaces ---
type Message = ChatMessage;

/** A row from GET /sessions/:id/messages. */
interface StoredMessage {
  id?: string;
  sender_type?: string;
  content?: string | null;
  created_at?: string;
  visualization_data?: unknown;
  metadata?: { suggestions?: unknown } | null;
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

// The theme hook that used to live here has been removed along with light mode.
//
// It ran `documentElement.classList.remove('light', 'dark')` and then re-added a
// class based on `localStorage` or `prefers-color-scheme`. Because it only ran
// on this route, it stripped the app-wide `dark` class set in index.html and
// left the chat pale while every other page stayed dark — the inconsistency
// this pass exists to remove. The app is dark-only; index.html owns the class.

// The shared instance in lib/api.ts attaches the Supabase access token and
// retries once on 401 with a refreshed one.
const useAPI = () => api;

// Guest sessions are ephemeral - no localStorage persistence

// --- SuggestionsScreen Component ---

SuggestionsScreen.displayName = 'SuggestionsScreen';

/** A sidebar name for a chat: the first words of its first message. */
function chatTitle(text: string): string {
  const words = text.replace(/\s+/g, " ").trim().split(" ").slice(0, 7).join(" ");
  return words.length > 48 ? `${words.slice(0, 47)}…` : words || "New Chat";
}

/** What to tell the user when a reply could not be fetched at all. */
function chatErrorText(error: { status?: number; message?: string }): string {
  if (error.status === 429) {
    return error.message
      ? `${error.message}`
      : "You've reached the guest limit for now. Sign in to keep chatting.";
  }
  if (error.status && error.status >= 500) {
    return "The tutor is having trouble right now. Please try again in a moment.";
  }
  if (!error.status) {
    return "Couldn't reach the tutor. Check your connection and try again.";
  }
  return `Something went wrong (${error.status}). Please try again.`;
}

// --- Main ChatInterface Component ---
const ChatInterface = () => {
  // --- Hooks and Context ---
  const { user, getChatSession, createChatSession, signOut, authDegraded } = useAuth();
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
  const [preferredLanguage, setPreferredLanguage] = useState<string>(
    () => {
      try {
        return localStorage.getItem("preferredLanguage") || "";
      } catch {
        return "";
      }
    },
  );
  const handlePreferredLanguageChange = useCallback((language: string) => {
    setPreferredLanguage(language);
    try {
      if (language) localStorage.setItem("preferredLanguage", language);
      else localStorage.removeItem("preferredLanguage");
    } catch {
      // A blocked localStorage must not break the setting for this session.
    }
  }, []);

  // The drawer's open state lives here so the header can own its control. It
  // used to be private to ChatSidebar, which is why the toggle had to be a
  // fixed-position button floating over the header.
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
  );
  const toggleSidebar = useCallback(() => setIsSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      setShowSettingsModal(false);
    } catch (error) {
      console.error("Sign out failed:", error);
      chatDispatch({ type: 'SET_ERROR', payload: "Could not sign out. Please try again." });
    }
  }, [signOut]);

  // --- Refs ---
  const chatWindowRef = useRef<HTMLDivElement>(null);
  // Refs, not state: read inside effects and written on every scroll event.
  const pinnedRef = useRef(true);
  const firstMessageIdRef = useRef<string | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);
  // Context the backend asked us to hold between turns. A ref, not state,
  // because handleSendMessage must read the latest value without re-subscribing.
  const pendingRef = useRef<PendingContext | null>(null);
  // True once a reply has taken long enough to start that the backend is
  // probably waking up; see TypingIndicator.
  const [slowStart, setSlowStart] = useState(false);
  const slowTimerRef = useRef<number | null>(null);
  const clearSlowStart = () => {
    if (slowTimerRef.current !== null) window.clearTimeout(slowTimerRef.current);
    slowTimerRef.current = null;
    setSlowStart(false);
  };

  // --- Memoized Values ---

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

    const currentUserMessageId = `user-${uuidv4()}`;
    const userMessage: Message = {
      id: currentUserMessageId,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    chatDispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    // Every chat used to stay "New Chat" in the sidebar: the row is created
    // before the first message, so nothing ever named it.
    if (user && chatState.messages.length === 0) {
      const sessionId = sessionState.session.id;
      const current = sessionState.sessions.find((s) => s.id === sessionId);
      if (!current?.session_name || current.session_name === "New Chat") {
        const name = chatTitle(textToSend);
        const updatedAt = new Date().toISOString();
        sessionDispatch({
          type: 'SET_SESSIONS',
          payload: sessionState.sessions.map((s) =>
            s.id === sessionId ? { ...s, session_name: name, updated_at: updatedAt } : s,
          ),
        });
        void supabase
          .from("chat_sessions")
          .update({ session_name: name, updated_at: updatedAt })
          .eq("id", sessionId)
          .then(({ error }) => {
            if (error) console.error("Could not name the chat:", error);
          });
      }
    }
    if (!messageText) {
      chatDispatch({ type: 'SET_INPUT_VALUE', payload: "" });
    }

    // `let`: an old backend can send a visualization mid-reply, and any text
    // after it starts a new message, which needs an id of its own. Reusing
    // this one gave two messages the same React key, and every later
    // UPDATE_MESSAGE edited both.
    let botMessageId = `bot-${uuidv4()}`;
    let accumulatedBotText = "";
    const controller = new AbortController();

    try {
      chatDispatch({ type: 'SET_TYPING', payload: true });
      clearSlowStart();
      slowTimerRef.current = window.setTimeout(() => setSlowStart(true), 8000);

      abortControllerRef.current?.abort();
      abortControllerRef.current = controller;

      // `pending` carries the LeetCode context the backend handed us on the
      // previous turn. Echoing it back keeps the two-message "which language?"
      // exchange working even if the backend restarted in between — which the
      // free tier does whenever it spins down.
      // Consume the pending context: clear it now so it cannot leak into a
      // later, unrelated turn. The backend re-sends it if it still needs one.
      const pending = pendingRef.current;
      pendingRef.current = null;

      const response = await postChatStream(
        sessionState.session.id,
        {
          user_input: textToSend,
          preferred_language: preferredLanguage || null,
          pending,
        },
        controller.signal,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detail = typeof errorData?.detail === "string" ? errorData.detail : "";
        throw Object.assign(new Error(detail || response.statusText), { status: response.status });
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get reader from response body");
      }

      const decoder = new TextDecoder();
      let isFirstChunk = true;
      const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      // Events are parsed across chunk boundaries (see lib/chatStream.ts):
      // splitting each chunk on newlines dropped any event a chunk cut in two.
      const parser = createSseParser(
        (event) => {
          switch (event.type) {
            case "text": {
              if (isFirstChunk) clearSlowStart();
              accumulatedBotText += event.content;
              if (isFirstChunk) {
                chatDispatch({
                  type: 'ADD_MESSAGE',
                  payload: { id: botMessageId, sender: "bot", text: accumulatedBotText, timestamp: now(), isStreaming: true },
                });
                isFirstChunk = false;
              } else {
                chatDispatch({
                  type: 'UPDATE_MESSAGE',
                  payload: { id: botMessageId, updates: { text: accumulatedBotText } },
                });
              }
              break;
            }
            case "pending":
              // The backend needs another turn to finish this request and
              // has handed us the context it will need.
              pendingRef.current = event.data as PendingContext;
              break;
            case "suggestions": {
              const suggestions = parseSuggestions(event.data);
              if (suggestions.length === 0 || isFirstChunk) break;
              chatDispatch({
                type: 'UPDATE_MESSAGE',
                payload: {
                  id: botMessageId,
                  updates: {
                    suggestions,
                    vizContext: buildVizContext(textToSend, accumulatedBotText),
                    autoOpenSuggestion: event.autoOpen,
                  },
                },
              });
              break;
            }
            case "visualization": {
              // Only an older backend sends these; kept so a deploy in either
              // order works.
              chatDispatch({
                type: 'ADD_MESSAGE',
                payload: {
                  id: `bot-viz-${uuidv4()}`,
                  sender: "bot",
                  text: "",
                  timestamp: now(),
                  isVisualization: true,
                  visualizationData: event.data,
                },
              });
              accumulatedBotText = "";
              isFirstChunk = true;
              botMessageId = `bot-${uuidv4()}`;
              break;
            }
            case "error":
              chatDispatch({
                type: 'ADD_MESSAGE',
                payload: { id: `error-${uuidv4()}`, sender: "bot", text: event.content, timestamp: now() },
              });
              break;
          }
        },
        (raw, error) => console.error("Unparseable chat event:", error, raw),
      );

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          parser.push(decoder.decode());
          parser.end();
          chatDispatch({ type: 'UPDATE_MESSAGE', payload: { id: botMessageId, updates: { timestamp: now(), isStreaming: false } } });
          break;
        }
        parser.push(decoder.decode(value, { stream: true }));
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("API Error:", error);
        // Shown once, as a message in the chat, in words a user can act on.
        // It used to be a toast and a bubble both reading "HTTP error 429: ...".
        const errorMessage: Message = {
          id: `error-${uuidv4()}`,
          sender: "bot",
          text: chatErrorText(error),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        chatDispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
      }
    } finally {
      chatDispatch({ type: 'UPDATE_MESSAGE', payload: { id: botMessageId, updates: { isStreaming: false } } });
      // Only this request's own state: a newer request may already own these.
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        chatDispatch({ type: 'SET_TYPING', payload: false });
        chatDispatch({ type: 'SET_LOADING', payload: false });
        clearSlowStart();
      }
    }
  }, [chatState.inputValue, chatState.isLoading, chatState.messages.length, sessionState.session?.id, sessionState.sessions, preferredLanguage, user]);

  const handleSessionSelect = useCallback(async (sessionId: string) => {
    if (sessionId === sessionState.selectedSessionId) return;
    // A reply still streaming belongs to the chat being left. Without this
    // its text was added to whichever chat was opened next.
    abortControllerRef.current?.abort();

    sessionDispatch({ type: 'SET_SELECTED_SESSION', payload: sessionId });
    sessionDispatch({ type: 'SET_SESSION', payload: { id: sessionId } });
    pendingRef.current = null;

    if (!user) {
      // Guest sessions are ephemeral: there is no stored history to fetch.
      chatDispatch({ type: 'SET_MESSAGES', payload: [] });
      return;
    }

    try {
      chatDispatch({ type: 'SET_LOADING', payload: true });
      chatDispatch({ type: 'SET_ERROR', payload: null });

      const response = await api.get(`/sessions/${sessionId}/messages`);
      const rows: StoredMessage[] = response.data || [];
      const historyMessages: Message[] = rows.map((msg, i) => {
        const sender: Message["sender"] =
          msg.sender_type === 'user' || msg.sender_type === 'bot' ? msg.sender_type : 'bot';
        const text = msg.content || "";
        const suggestions = sender === "bot" ? parseSuggestions(msg.metadata?.suggestions) : [];
        // The question a stored answer replied to: the nearest user message before it.
        const question = rows.slice(0, i).reverse().find((m) => m.sender_type === 'user')?.content ?? "";
        return {
          id: msg.id || `fallback-${uuidv4()}`,
          sender,
          text,
          timestamp: msg.created_at
            ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isVisualization: msg.visualization_data !== null && msg.visualization_data !== undefined,
          visualizationData: msg.visualization_data,
          ...(suggestions.length > 0 && { suggestions, vizContext: buildVizContext(question, text) }),
        };
      });

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
  }, [sessionState.selectedSessionId, api, user]);

  const handleNewChat = useCallback(async () => {
    if (sessionState.isCreatingSession) return;
    abortControllerRef.current?.abort();

    try {
      sessionDispatch({ type: 'SET_CREATING_SESSION', payload: true });
      chatDispatch({ type: 'SET_LOADING', payload: true });

      let newSessionRecord;

      if (user) {
        newSessionRecord = await createChatSession();
      } else {
        // Guest mode: Generate UUID locally (ephemeral, no DB persistence)
        // crypto.randomUUID is only available in a secure context, so fall
        // back to the uuid package rather than throwing on plain http.
        const sessionId =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : uuidv4();
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
      pendingRef.current = null;

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
        .eq("id", sessionToDelete)
        // Row level security enforces this too; stating it keeps the intent
        // visible and lets the query use the owner index.
        .eq("user_id", user.id);

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

  // Track whether the reader is at the bottom of the list, and keep them there
  // when the list itself shrinks. With interactive-widget=resizes-content the
  // Android keyboard shrinks the layout, and without the re-pin the newest
  // message would end up hidden under the composer.
  useEffect(() => {
    const el = chatWindowRef.current;
    if (!el) return;

    // Height as of the last resize this effect has handled.
    let handledHeight = el.clientHeight;

    const onScroll = () => {
      // A resize can move scrollTop by itself — scroll anchoring shifts it when
      // content sized to the list (the h-full suggestions screen) shrinks with
      // it — and that scroll event arrives before the ResizeObserver callback.
      // It is the browser relaying out, not the reader scrolling, so it must
      // not unpin; the observer below settles the position instead.
      if (el.clientHeight !== handledHeight) return;
      pinnedRef.current = isNearBottom(el.scrollTop, el.clientHeight, el.scrollHeight);
    };
    el.addEventListener("scroll", onScroll, { passive: true });

    const observer = new ResizeObserver(() => {
      handledHeight = el.clientHeight;
      if (pinnedRef.current) el.scrollTop = el.scrollHeight;
    });
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  // Follow new content only while pinned, so scrolling up to reread something
  // mid-answer is not yanked back down on every streamed chunk. Sending a
  // message, or opening a different conversation, always jumps to the end.
  useEffect(() => {
    const el = chatWindowRef.current;
    if (!el) return;

    const messages = chatState.messages;
    const firstId = messages[0]?.id;
    const switched = firstId !== firstMessageIdRef.current;
    firstMessageIdRef.current = firstId;
    const justSent = messages[messages.length - 1]?.sender === "user";

    if (!pinnedRef.current && !switched && !justSent) return;
    pinnedRef.current = true;
    el.scrollTo({
      top: el.scrollHeight,
      // Back-to-back smooth scrolls fight each other while a reply streams in.
      behavior: chatState.isTyping ? "auto" : "smooth",
    });
  }, [chatState.messages, chatState.isTyping]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    // w-full, not w-screen: 100vw includes the scrollbar gutter.
    <div className="relative flex h-[100dvh] w-full overflow-hidden overscroll-none bg-background">
      {/* Background Elements */}
      <div className="pointer-events-none absolute left-0 top-0 h-[500px] w-full bg-gradient-to-b from-primary/10 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-secondary/5 blur-[100px]" />

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
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      {/* h-full, not h-screen. The parent is 100dvh and clips its overflow; on
          Android, 100vh is the viewport with the URL bar HIDDEN, so an h-screen
          child is ~60-110px taller than the box clipping it and the composer at
          its bottom gets cut off whenever the URL bar is showing. */}
      <div className="relative z-10 flex h-full min-h-0 flex-1 flex-col">

        {/* A normal flex child rather than an absolutely-positioned bar. The old
            version was `absolute top-4` with the main region clearing it via a
            magic pt-20, which broke as soon as the title wrapped at 360px. */}
        <header className="z-20 shrink-0 px-3 pt-3 sm:px-4 sm:pt-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 rounded-full border border-white/10 bg-card/80 px-2 py-2 shadow-lg backdrop-blur-md sm:px-4">
            <div className="flex min-w-0 items-center gap-1 sm:gap-2">
              {/* Lives here rather than floating over the header. It used to be
                  `fixed left-4 top-4`, landing exactly on top of this bar. */}
              <button
                onClick={toggleSidebar}
                aria-label="Open chat history"
                aria-expanded={isSidebarOpen}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground lg:hidden"
              >
                <PanelLeft className="h-5 w-5" />
              </button>

              <div className="hidden shrink-0 rounded-full border border-primary/20 bg-primary/10 p-2 sm:block">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h1 className="truncate text-sm font-semibold tracking-wide text-foreground">
                AI Architect
                <span className="ml-2 hidden font-normal text-muted-foreground sm:inline">| v2.0</span>
              </h1>
            </div>

            <div className="flex shrink-0 items-center">
              <div className="mr-2 hidden items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground md:flex">
                <div className="h-2 w-2 animate-pulse rounded-full bg-viz-found" />
                <span>System Online</span>
              </div>

              <button
                onClick={handleNewChat}
                disabled={sessionState.isCreatingSession}
                className="group grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground disabled:opacity-50"
                title="New Chat"
                aria-label="New chat"
              >
                {sessionState.isCreatingSession ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <MessageSquarePlus className="h-5 w-5 transition-colors group-hover:text-primary" />
                )}
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="group grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground"
                title="Settings"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5 transition-colors group-hover:text-primary" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 justify-center overflow-hidden px-2 pb-0 pt-2 sm:px-4">
          <div className="flex flex-col h-full w-full max-w-5xl mx-auto">
            {/* Account state, not message state: this must sit alongside the
                conversation rather than replacing it. */}
            {authDegraded && (
              <div
                role="status"
                className="mx-2 mb-2 flex items-start gap-3 rounded-xl border border-viz-compare/30 bg-viz-compare/10 px-4 py-3 text-sm text-viz-compare sm:mx-4"
              >
                <CloudOff className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  Can&apos;t reach the sign-in service. You can keep chatting, but this
                  conversation won&apos;t be saved.
                </span>
              </div>
            )}
            <div
              ref={chatWindowRef}
              className="scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-y-contain px-2 py-4 sm:px-4 sm:py-6"
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
                      <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-teal-500 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-primary animate-pulse" />
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
                    {/* Errors show once, in the toast; the in-list copy had a
                        "Retry" that only hid the message. Virtualization stays
                        off: its rows are a fixed 120px, and markdown answers
                        are taller, so long chats overlapped. */}
                    <ChatWindow
                      messages={chatState.messages}
                      isLoading={chatState.isTyping}
                      enableVirtualization={false}
                    />
                    {/* Only until the reply starts: the answer's own cursor
                        shows it is still streaming. */}
                    {chatState.isTyping &&
                      chatState.messages[chatState.messages.length - 1]?.sender === "user" && (
                        <TypingIndicator slow={slowStart} />
                      )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Composer. pb allows for the Android gesture bar / iOS home
                indicator, which otherwise sit on top of the send button. */}
            <div
              className="shrink-0 px-2 pb-2 pt-2 sm:px-4 sm:pb-4"
              style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
            >
              <div className="relative rounded-2xl border border-white/10 bg-card/80 shadow-2xl backdrop-blur-xl transition-all duration-300 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
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
                  className="scrollbar-thin scrollbar-thumb-white/10 min-h-[56px] w-full resize-none rounded-2xl bg-transparent px-4 py-4 pr-16 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none sm:px-5"
                  disabled={chatState.isTyping || (!sessionState.session?.id)}
                />

                <div className="absolute bottom-1.5 right-1.5">
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={chatState.isTyping || !chatState.inputValue.trim() || (!sessionState.session?.id)}
                    aria-label="Send message"
                    className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {chatState.isTyping ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <p className="mt-2 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                AI-generated • may be wrong
              </p>
            </div>

          </div>
        </main>

        <AnimatePresence>
          {chatState.error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              className="absolute left-1/2 top-20 z-50 flex w-auto max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive-foreground shadow-xl backdrop-blur-md sm:max-w-md"
            >
              <span>{chatState.error}</span>
              <button
                onClick={() => chatDispatch({ type: 'SET_ERROR', payload: null })}
                className="shrink-0 text-destructive transition-colors hover:text-foreground"
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
              onClose={() => setShowSettingsModal(false)}
              userEmail={user?.email ?? null}
              onSignOut={handleSignOut}
              preferredLanguage={preferredLanguage}
              onPreferredLanguageChange={handlePreferredLanguageChange}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default React.memo(ChatInterface);