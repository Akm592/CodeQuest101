import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { MessageCircle, Plus, CalendarDays, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface ChatSessionInfo {
  id: string;
  session_name: string | null;
  created_at: string;
  updated_at: string;
}

interface ChatSidebarProps {
  sessions: ChatSessionInfo[];
  onSessionSelect: (sessionId: string) => void;
  selectedSessionId: string | null;
  onCreateNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  isCreatingSession?: boolean;
}

const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Unknown";

    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSeconds < 60) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "Unknown";
  }
};

const getSessionDisplayName = (session: ChatSessionInfo, index: number): string => {
  const potentialDefaultName = `Chat ${index + 1}`;
  if (session.session_name && session.session_name.trim().length > 3 && session.session_name !== potentialDefaultName) {
    return session.session_name.trim();
  }
  return `Chat (${formatRelativeTime(session.created_at)})`;
};

const SessionItem = React.memo<{
  session: ChatSessionInfo;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}>(({ session, index, isSelected, onSelect, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteTimeoutRef = useRef<NodeJS.Timeout>();

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    deleteTimeoutRef.current = setTimeout(() => {
      onDelete(session.id);
      setIsDeleting(false);
    }, 150);
  }, [onDelete, session.id]);

  const handleSelect = useCallback(() => {
    if (!isDeleting) onSelect(session.id);
  }, [onSelect, session.id, isDeleting]);

  useEffect(() => () => {
    if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
  }, []);

  const displayName = useMemo(() => getSessionDisplayName(session, index), [session, index]);
  const relativeTime = useMemo(() => formatRelativeTime(session.updated_at), [session.updated_at]);

  return (
    <div
      className={`group relative rounded-xl overflow-hidden transition-all duration-300 ease-out transform
        ${isSelected
          ? "bg-blue-500/15 dark:bg-blue-600/25 ring-2 ring-blue-500/30 dark:ring-blue-400/40 scale-[1.02]"
          : "hover:bg-gray-500/8 dark:hover:bg-white/8 hover:scale-[1.01]"
        }
        ${isDeleting ? "opacity-50 scale-95" : "opacity-100"}
      `}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
    >
      <button
        onClick={handleSelect}
        disabled={isDeleting}
        className="w-full flex items-start p-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-400/50 rounded-xl transition-all duration-200"
        aria-current={isSelected ? "page" : undefined}
        aria-label={`Select conversation: ${displayName}`}
        title={displayName}
      >
        <div className="mr-3 mt-1 transition-transform duration-200 group-hover:scale-110">
          <MessageCircle className={`w-4 h-4 transition-colors duration-200 ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate transition-colors duration-200 ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400"}`}>
            {displayName}
          </p>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-200 group-hover:text-gray-600 dark:group-hover:text-gray-300">
            <CalendarDays className="w-3 h-3 mr-1 flex-shrink-0" />
            <span>{relativeTime}</span>
          </div>
        </div>
      </button>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full 
                  text-gray-400 dark:text-gray-500 transition-all duration-200
                  opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
                  hover:bg-red-500/15 hover:text-red-500 hover:scale-110
                  dark:hover:bg-red-400/15 dark:hover:text-red-400
                  focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:opacity-100
                  disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={`Delete conversation: ${displayName}`}
        title="Delete Chat"
      >
        {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
});
SessionItem.displayName = 'SessionItem';

const ChatSidebar: React.FC<ChatSidebarProps> = React.memo(({
  sessions,
  onSessionSelect,
  selectedSessionId,
  onCreateNewSession,
  onDeleteSession,
  isCreatingSession = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(window.innerWidth > 1024);
  const [isAnimating, setIsAnimating] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleToggleExpanded = useCallback(() => {
    setIsAnimating(true);
    setIsExpanded(prev => !prev);
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  const handleSessionSelect = useCallback((sessionId: string) => {
    if (sessionId !== selectedSessionId) {
      onSessionSelect(sessionId);
    }
    if (window.innerWidth < 1024) {
      setIsExpanded(false);
    }
  }, [onSessionSelect, selectedSessionId]);

  const handleCreateSession = useCallback(() => {
    if (!isCreatingSession) {
      onCreateNewSession();
    }
    if (window.innerWidth < 1024) {
      setIsExpanded(false);
    }
  }, [onCreateNewSession, isCreatingSession]);

  const handleDeleteSession = useCallback((sessionId: string) => {
    onDeleteSession(sessionId);
  }, [onDeleteSession]);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [sessions]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsExpanded(true);
      } else {
        setIsExpanded(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        handleToggleExpanded();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, handleToggleExpanded]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 z-30 transition-opacity lg:hidden ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={handleToggleExpanded}
      />
      
      <button
        onClick={handleToggleExpanded}
        className={`fixed left-3 top-4 z-40 rounded-full p-2 shadow-lg transition-all duration-300 ease-out
          bg-blue-500 text-white hover:bg-blue-600 hover:scale-110 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2
          lg:hidden ${isExpanded ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}
        aria-label="Show sidebar"
        disabled={isAnimating}
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      <aside
        ref={sidebarRef}
        className={`bg-white/20 dark:bg-slate-900/40 backdrop-blur-xl m-2 rounded-2xl
                   h-[calc(100%-1rem)] flex flex-col shadow-xl border border-white/10 
                   dark:border-white/5 overflow-hidden transition-all duration-300 ease-out
                   fixed lg:relative z-40
                   ${isExpanded ? 'w-72 translate-x-0' : '-translate-x-full w-72 lg:w-0 lg:m-0 lg:translate-x-0'}
        `}
        role="complementary"
        aria-label="Chat conversations sidebar"
        aria-expanded={isExpanded}
      >
        <div className="flex-1 flex flex-col min-h-0">
            <header className="p-5 flex-shrink-0 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-800 dark:text-gray-100 flex items-center">
                <span>Conversations</span>
                {sessions.length > 0 && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full font-medium">
                    {sessions.length}
                  </span>
                )}
              </h2>
              <button
                onClick={handleToggleExpanded}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 
                         transition-all duration-200 hover:scale-110 active:scale-95 lg:hidden
                         focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                aria-label="Hide sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </header>

            <div className="flex-grow px-3 pb-3 pt-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400/50 dark:scrollbar-thumb-gray-600/50 scrollbar-track-transparent">
              {sortedSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4 text-gray-500 dark:text-gray-400 animate-fade-in">
                  <div className="mb-4 p-3 rounded-full bg-gray-100 dark:bg-gray-800/50">
                    <MessageCircle className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-sm font-medium mb-1">No Conversations Yet</p>
                  <p className="text-xs opacity-75">Start a new conversation below</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedSessions.map((session, index) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      index={index}
                      isSelected={selectedSessionId === session.id}
                      onSelect={handleSessionSelect}
                      onDelete={handleDeleteSession}
                    />
                  ))}
                </div>
              )}
            </div>

            <footer className="p-3 mt-auto flex-shrink-0">
              <button
                onClick={handleCreateSession}
                disabled={isCreatingSession}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 
                         text-white rounded-xl p-3 flex items-center justify-center space-x-2
                         hover:from-blue-600 hover:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700
                         focus:outline-none focus:ring-2 focus:ring-blue-400/50 dark:focus:ring-blue-500/50
                         shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                aria-label="Create new conversation"
              >
                {isCreatingSession ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span className="font-medium">
                  {isCreatingSession ? "Creating..." : "New Conversation"}
                </span>
              </button>
            </footer>
        </div>
      </aside>
    </>
  );
});
ChatSidebar.displayName = 'ChatSidebar';

export default ChatSidebar;