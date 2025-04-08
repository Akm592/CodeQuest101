// chatbot.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, MessageSquarePlus, X, Settings, Sparkles, Lightbulb, Trash2 } from "lucide-react";
import ChatWindow from "./ChatWindow";
import TypingIndicator from "./TypingIndicator";
import { useAuth } from "../../contexts/AuthContext";
import ChatSidebar from "./ChatSidebar";
import SettingsModal from "./SettingsModal"; // Import the new modal
import { supabase } from "../../lib/supabaseClient";

// --- Interfaces (Keep these as they are) ---
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

// --- SuggestionsScreen Component (Redesigned) ---
const SuggestionsScreen = ({ onSuggestionClick }: { onSuggestionClick: (suggestion: string) => void }) => {
  const suggestions = [
    "Explain quicksort with a step-by-step example.",
    "Visualize a BFS traversal on a sample graph.",
    "Generate a linked list visualization for [1, 2, 3, 4].",
    "Explain the two-pointer technique with an example.",
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-800 dark:text-gray-100 p-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="text-center mb-10"
      >
        <Sparkles className="w-16 h-16 mx-auto text-blue-500 dark:text-blue-400 mb-4" />
        <h2 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400">
          Welcome to AI Assistant
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">How can I help you today?</p>
      </motion.div>

      <div className="w-full max-w-3xl">
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-5 flex items-center justify-center gap-2">
          <Lightbulb className="w-5 h-5" />
          <span>Try these suggestions:</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="bg-white/30 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10
                         text-gray-800 dark:text-gray-200 rounded-xl p-5 text-left shadow-lg hover:shadow-xl
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
};


// --- ChatInterface Component (Main Logic - Unchanged State/Hooks, Modified JSX for Styling) ---
const ChatInterface = () => {
  // --- Core State, Refs, and Hooks (DO NOT CHANGE) ---
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
  // REMOVED: const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [theme, setTheme] = useState<string>("system");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const apiLink = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  });
  // --- End Core State ---

  // --- NEW State for Settings Modal ---
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // --- Core useEffects and Functions (DO NOT CHANGE LOGIC) ---

  // Fetch chat sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (user) {
        try {
          // Simulate loading
          // await new Promise(resolve => setTimeout(resolve, 500));

          const { data: fetchedSessions, error: fetchError } = await supabase
            .from("chat_sessions")
            .select("*")
            .eq("user_id", user.id)
            .order('created_at', { ascending: false }); // Fetch newest first

          if (fetchError) {
            console.error("Error fetching chat sessions:", fetchError);
            setError("Failed to load chat sessions.");
          } else {
            setChatSessions(fetchedSessions || []); // Ensure it's an array
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


  // Close sidebar on outside click
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

  // Initialize chat session
  const initChatSession = useCallback(async () => {
    if (user) {
      try {
        setIsLoading(true);
        let sessionRecord = await getChatSession();
        if (!sessionRecord) {
          // If no active session found, check if there are any sessions at all
          const { data: existingSessions, error: fetchError } = await supabase
            .from("chat_sessions")
            .select("id")
            .eq("user_id", user.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (fetchError) throw fetchError;

          if (existingSessions && existingSessions.length > 0) {
            // If sessions exist, load the latest one instead of creating new
            sessionRecord = await getChatSession(); // getChatSession does not take any arguments
            if (!sessionRecord) { // Fallback if getChatSession with ID fails
              sessionRecord = await createNewChatSession();
            }
          } else {
            // Only create a new session if none exist
            sessionRecord = await createNewChatSession();
          }
        }
        setSession(sessionRecord);
        setSelectedSessionId(sessionRecord.id);
        await loadMessageHistory(sessionRecord.id);
      } catch (err) {
        console.error("Error initializing chat session", err);
        setError("Failed to initialize chat session.");
        setMessages([]); // Clear messages on error
        setSession(null);
        setSelectedSessionId(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Handle logged out state
      setSession(null);
      setSelectedSessionId(null);
      setMessages([]);
      setIsLoading(false);
    }
  }, [user, getChatSession]); // Dependencies might need adjustment based on createNewChatSession implementation

  useEffect(() => {
    initChatSession();
  }, [initChatSession]); // Run initChatSession when it changes (due to user change etc.)


  // Load messages on session change
  useEffect(() => {
    if (selectedSessionId) {
      loadMessageHistory(selectedSessionId);
      // Close sidebar on mobile when a session is selected
      if (window.innerWidth < 768 && sidebarOpen) {
        setSidebarOpen(false);
      }
    } else if (!user) {
      setMessages([]); // Clear messages if user logs out
    }
    // Do not clear messages if selectedSessionId is null but user exists (e.g., during initial load/creation)
  }, [selectedSessionId, user]); // Add user dependency


  // Apply and persist theme
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


  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "system";
    setTheme(savedTheme);
    applyTheme(savedTheme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    // Use addEventListener for modern browsers
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Cleanup function to remove the listener
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme, applyTheme]);


  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
    setShowSettingsModal(false); // Close modal after selection
  };

  // Load message history
  const loadMessageHistory = async (sessionId: string) => {
    if (!sessionId) return; // Prevent loading if sessionId is invalid
    try {
      setIsLoading(true);
      setError(null); // Clear previous errors
      const response = await api.get(`/sessions/${sessionId}/messages`);
      // Map response carefully, handle potential nulls or different structures
      const historyMessages: Message[] = (response.data || []).map((msg: any) => ({
        id: msg.id || `fallback-${Math.random()}`, // Provide fallback id
        sender: msg.sender_type === 'user' || msg.sender_type === 'bot' ? msg.sender_type : 'bot', // Validate sender
        text: msg.content || "", // Ensure text is string
        timestamp: msg.created_at
          ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isVisualization: msg.visualization_data !== null && msg.visualization_data !== undefined,
        visualizationData: msg.visualization_data,
      }));
      setMessages(historyMessages);
    } catch (error: any) {
      console.error("Error loading message history:", error);
      if (error.response && error.response.status === 404) {
        setError(`Chat session (${sessionId}) not found. It might have been deleted.`);
        // Optionally reset state if session is invalid
        setSelectedSessionId(null);
        setSession(null);
        setMessages([]);
      } else {
        setError("Failed to load message history. Please try again.");
      }
      setMessages([]); // Clear messages on error
    } finally {
      setIsLoading(false);
    }
  };

  // Create new chat session
  const createNewChatSession = async () => {
    if (!user) throw new Error("User not logged in"); // Guard clause

    try {
      setIsLoading(true);
      // Call the function from AuthContext to create the session
      const newSessionRecord = await createChatSession(); // This should handle Supabase interaction

      if (!newSessionRecord || !newSessionRecord.id) {
        throw new Error("Failed to create session record");
      }

      // Update local state immediately
      setSession(newSessionRecord);
      setSelectedSessionId(newSessionRecord.id);
      setMessages([]); // Start with empty messages

      // Fetch updated list of sessions to include the new one
      const { data: updatedSessions, error: fetchError } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error("Error refetching sessions after creation:", fetchError);
        // Don't necessarily set an error state here, as the session *was* created
      } else {
        setChatSessions(updatedSessions || []);
      }


      // No need to call api.get('/sessions') if Supabase is the source of truth
      // and chatSessions state is updated directly or via fetchSessions effect

      return newSessionRecord; // Return the newly created session info
    } catch (error) {
      console.error("Error creating new chat session:", error);
      setError("Failed to create a new chat session. Please try again.");
      throw error; // Re-throw to be caught by caller if needed
    } finally {
      setIsLoading(false);
    }
  };

  // Handle new chat button click
  const handleNewChat = async () => {
    try {
      await createNewChatSession(); // This now handles loading state and updates
      if (window.innerWidth < 768) {
        setSidebarOpen(false); // Close sidebar on mobile after creating new chat
      }
    } catch (error) {
      // Error is already handled within createNewChatSession
      console.log("Handling new chat creation failure (already logged).");
    }
  };


  // Auto-scroll chat window
  useEffect(() => {
    if (chatWindowRef.current) {
      // Use smooth scrolling for better UX
      chatWindowRef.current.scrollTo({
        top: chatWindowRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]); // Also scroll when typing indicator appears/disappears


  // Handle sending message
  const handleSendMessage = async (messageText?: string) => {
    const textToSend = (messageText || inputValue).trim();
    // Add check for session ID existence
    if (!textToSend || isLoading || !session || !session.id) {
      if (!session || !session.id) {
        setError("No active chat session. Please start a new chat.");
        console.error("Attempted to send message without a valid session ID.");
      }
      return;
    }

    setError(null);
    // Keep setIsLoading(false) here - it should be false before sending
    // setIsTyping(true) indicates the *bot* is about to type
    const currentUserMessageId = `user-${Date.now()}-${Math.random()}`;
    const userMessage: Message = {
      id: currentUserMessageId,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Optimistically update UI
    setMessages((prev) => [...prev, userMessage]);
    if (!messageText) {
      setInputValue(""); // Clear input only if it wasn't a suggestion click
    }

    // Prepare for bot response - No need to add an empty message immediately for streaming
    // setIsTyping(true); // Indicate bot is "thinking" / preparing response


    // --- Bot Response Handling ---
    const botMessageId = `bot-${Date.now()}-${Math.random()}`;
    let accumulatedBotText = ""; // Store text for the current bot message

    try {
      setIsTyping(true); // Set typing indicator active *before* the fetch call

      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/chat`, {

    try {
      const response = await fetch(`${apiLink}/chat`, {

        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": session.id, // Ensure session.id is passed
          // Add Authorization header if your API requires it
          // 'Authorization': `Bearer ${your_auth_token}`
        },
        body: JSON.stringify({ user_input: textToSend }),
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
          // Add final bot message state if needed (e.g., update timestamp)
          setMessages(prev => prev.map(msg =>
            msg.id === botMessageId
              ? { ...msg, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
              : msg
          ));
          break; // Exit loop when stream is finished
        }

        const chunk = decoder.decode(value, { stream: true });
        // console.log("Raw Chunk:", chunk); // Debugging: Log raw chunks

        // Process Server-Sent Events (SSE) data format "data: {...}\n\n"
        const lines = chunk.split('\n');
        lines.forEach(line => {
          if (line.startsWith("data:")) {
            try {
              const jsonString = line.substring(5).trim(); // Remove "data:" prefix and trim
              if (jsonString) { // Ensure it's not empty
                const data = JSON.parse(jsonString);
                // console.log("Parsed Data:", data); // Debugging: Log parsed data

                // Handle different data types (text, visualization, etc.)
                if (data.type === "text") {
                  accumulatedBotText += data.content;

                  if (isFirstChunk) {
                    // Add the bot message bubble on the first text chunk
                    const newBotMessage: Message = {
                      id: botMessageId,
                      sender: "bot",
                      text: accumulatedBotText,
                      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      isVisualization: false,
                    };
                    setMessages((prev) => [...prev, newBotMessage]);
                    isFirstChunk = false;
                  } else {
                    // Update the existing bot message bubble
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === botMessageId
                          ? { ...msg, text: accumulatedBotText }
                          : msg
                      )
                    );
                  }
                } else if (data.type === "visualization") {
                  // If visualization comes, potentially replace or add a new message
                  const vizMessage: Message = {
                    id: `bot-viz-${Date.now()}`, // Unique ID for viz message
                    sender: "bot",
                    text: data.description || " ", // Optional description or placeholder
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    isVisualization: true,
                    visualizationData: data.data,
                  };
                  // Decide whether to replace the text message or add a new one
                  // For simplicity, let's add it as a new message
                  setMessages(prev => [...prev, vizMessage]);
                  // Reset accumulated text if needed, or adjust logic based on desired flow
                  accumulatedBotText = "";
                  isFirstChunk = true; // Allow a new text message after viz
                }
                // Add handling for other potential types (e.g., 'error', 'info')
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e, "Line:", line);
              // Don't add error message to chat here, let the main catch handle API errors
            }
          }
        });
      } // end while loop

    } catch (error: any) {
      console.error("API Error:", error);
      setError(error.message || "Failed to get response from the server.");
      // Remove the optimistic user message if the API call fails? (Optional, depends on desired UX)
      // setMessages(prev => prev.filter(msg => msg.id !== currentUserMessageId));

      // Add a specific error message from the bot
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        sender: "bot",
        text: `Sorry, I encountered an error: ${error.message}. Please check the connection or try again later.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);

    } finally {
      setIsTyping(false); // Stop typing indicator regardless of success or failure
      setIsLoading(false); // Ensure loading state is reset (though it wasn't set true in this func)
    }
  };

  // Handle session selection
  const handleSessionSelect = async (sessionId: string) => {
    if (sessionId === selectedSessionId) return; // Avoid reloading same session
    setSelectedSessionId(sessionId);
    // Optimistically set session object, loadMessageHistory will fetch details
    setSession({ id: sessionId });
    // `loadMessageHistory` is triggered by the useEffect watching `selectedSessionId`
  };

  // Toggle sidebar
  // const toggleSidebar = () => {
  //   setSidebarOpen(!sidebarOpen);
  // };

  // Confirm delete
  const confirmDelete = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setShowDeleteConfirm(true);
  }

  // Handle deleting session
  const handleDeleteSession = async () => {
    if (!sessionToDelete || !user) return;

    const sessionName = chatSessions.find(s => s.id === sessionToDelete)?.session_name || `Chat ${sessionToDelete.substring(0, 6)}`;

    try {
      // Optimistically remove from UI first for faster feedback
      const originalSessions = [...chatSessions];
      setChatSessions((prev) => prev.filter((s) => s.id !== sessionToDelete));
      setShowDeleteConfirm(false);

      // Determine the next session to select
      let nextSessionId: string | null = null;
      if (selectedSessionId === sessionToDelete) {
        const remainingSessions = originalSessions.filter((s) => s.id !== sessionToDelete);
        if (remainingSessions.length > 0) {
          // Select the first remaining session (which should be the next newest)
          nextSessionId = remainingSessions[0].id;
        }
      }


      // Perform the actual deletion
      const { error: deleteError } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", sessionToDelete);

      if (deleteError) {
        // Revert optimistic update if deletion fails
        setChatSessions(originalSessions);
        console.error("Error deleting session:", deleteError);
        setError(`Failed to delete session: ${sessionName}.`);
      } else {
        // Deletion successful
        setError(null); // Clear any previous errors
        console.log(`Session ${sessionName} deleted successfully.`);

        // If the deleted session was selected, switch to the next session or create a new one
        if (selectedSessionId === sessionToDelete) {
          if (nextSessionId) {
            setSelectedSessionId(nextSessionId);
            setSession({ id: nextSessionId }); // Update session context
          } else {
            // If no sessions remain, create a new one
            await handleNewChat();
          }
        }
      }
    } catch (error: any) {
      // Catch unexpected errors during the process
      console.error("Error during session deletion process:", error);
      setError(`An unexpected error occurred while deleting session ${sessionName}.`);
      // Potentially revert UI changes if needed, though optimistic update is tricky here
    } finally {
      // Ensure modal is closed and ID is cleared
      setShowDeleteConfirm(false);
      setSessionToDelete(null);
    }
  };

  // --- JSX (Redesigned UI) ---
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-100 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-800">
      {/* Sidebar with new collapsible functionality */}
      <ChatSidebar
        sessions={chatSessions}
        onSessionSelect={handleSessionSelect}
        selectedSessionId={selectedSessionId}
        onCreateNewSession={handleNewChat}
        onDeleteSession={confirmDelete}
        initiallyExpanded={window.innerWidth > 768} // Collapse by default on mobile
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header - Styled to match sidebar aesthetic */}
        <header className="bg-white/20 dark:bg-slate-900/40 backdrop-blur-xl border-b border-white/10 dark:border-white/5 m-2 mt-2 mb-0 rounded-t-2xl px-4 py-3 shadow-md flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-medium text-gray-800 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              AI Assistant
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleNewChat}
              disabled={isLoading && !messages.length}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 
                        text-white rounded-xl p-2 flex items-center justify-center space-x-1
                        hover:from-blue-600 hover:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700
                        focus:outline-none focus:ring-2 focus:ring-blue-400/50 dark:focus:ring-blue-500/50
                        shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="New Chat"
              title="New Conversation"
            >
              <MessageSquarePlus className="w-5 h-5" />
              <span className="hidden sm:inline font-medium text-sm">New Chat</span>
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-colors duration-200"
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Chat Content */}
        <main className="flex-1 overflow-hidden flex justify-center items-center p-2">
          <div className="bg-white/20 dark:bg-slate-900/40 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-2xl shadow-xl flex flex-col h-full w-full max-w-5xl mx-auto min-h-0">
            {/* Chat Window Area */}
            <div
              ref={chatWindowRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin scrollbar-thumb-gray-400/50 dark:scrollbar-thumb-gray-600/50 scrollbar-track-transparent scrollbar-thumb-rounded-full hover:scrollbar-thumb-gray-500/60 dark:hover:scrollbar-thumb-gray-500/60"
            >
              <AnimatePresence mode="wait">
                {isLoading && messages.length === 0 ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center h-full"
                  >
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500 dark:text-blue-400" />
                  </motion.div>
                ) : !isLoading && messages.length === 0 ? (
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
                  >
                    <ChatWindow messages={messages} />
                    {isTyping && <TypingIndicator />}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


            {/* Input Area - Refined with more rounded design */}
            <div className="border-t border-white/10 dark:border-white/5 p-3 sm:p-4 mt-auto flex-shrink-0">
              <div className="w-full flex items-end space-x-2 bg-white/30 dark:bg-black/20 backdrop-blur-md border border-white/10 dark:border-white/5 rounded-full shadow-inner px-4 py-3">
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
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !isTyping) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Send a message..."
                  rows={1}
                  className="flex-1 bg-transparent focus:outline-none text-sm placeholder-gray-500 dark:placeholder-gray-400 text-gray-800 dark:text-gray-100 resize-none scrollbar-thin ml-1"
                  disabled={isTyping || (!session || !session.id)}
                  style={{
                    maxHeight: "120px",
                    border: "none",  // make the border transparent
                    boxShadow: "none"  // remove any default browser box-shadow if needed
                  }}
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={isTyping || !inputValue.trim() || (!session || !session.id)}
                  className={`bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 
                text-white rounded-full p-2.5 hover:from-blue-600 hover:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700 
                focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2
                dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed 
                transition-all duration-200 ${inputValue.trim() ? 'opacity-100' : 'opacity-50'}`}
                  aria-label="Send message"
                >
                  {isTyping ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

          </div>
        </main>

        {/* Error Message Toast */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              className="fixed top-5 left-1/2 -translate-x-1/2 w-auto max-w-md bg-red-100/80 dark:bg-red-900/80 backdrop-blur-sm text-red-700 dark:text-red-200 px-4 py-3 rounded-lg shadow-lg border border-red-300 dark:border-red-700 z-50 flex items-center justify-between space-x-4"
              role="alert"
            >
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-500 dark:text-red-300 hover:text-red-700 dark:hover:text-red-100 p-1 rounded-full hover:bg-red-200/50 dark:hover:bg-red-800/50"
                aria-label="Close error message"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
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

        {/* Settings Modal */}
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

export default ChatInterface;
