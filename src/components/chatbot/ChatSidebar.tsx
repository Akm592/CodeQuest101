import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { MessageCircle, Plus, CalendarDays, X, ChevronRight, Loader2, Sparkles, FolderOpen } from "lucide-react";

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
  return `Session ${index + 1}`; // Simplified default names
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
      className={`group relative rounded-xl transition-all duration-200 mb-2
        ${isSelected
          ? "bg-teal-500/10 border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.1)]"
          : "hover:bg-gray-100/50 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/5"
        }
        ${isDeleting ? "opacity-50 scale-95" : "opacity-100"}
      `}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <button
        onClick={handleSelect}
        disabled={isDeleting}
        className="w-full flex items-center p-3 text-left focus:outline-none rounded-xl"
        title={displayName}
      >
        <div className={`mr-3 p-2 rounded-lg transition-colors ${isSelected ? "bg-teal-500/20 text-teal-400" : "bg-gray-200/50 dark:bg-white/5 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"}`}>
          <MessageCircle className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isSelected ? "text-teal-600 dark:text-teal-50" : "text-gray-700 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"}`}>
            {displayName}
          </p>
          <div className="flex items-center text-[10px] text-gray-500 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-500 mt-0.5">
            <CalendarDays className="w-3 h-3 mr-1" />
            <span>{relativeTime}</span>
          </div>
        </div>
      </button>

      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg
                  text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-all
                  hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400
                  focus:opacity-100 focus:outline-none"
        title="Delete Chat"
      >
        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
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
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleToggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Auto-close on mobile selection
  const handleSessionSelect = useCallback((sessionId: string) => {
    if (sessionId !== selectedSessionId) onSessionSelect(sessionId);
    if (window.innerWidth < 1024) setIsExpanded(false);
  }, [onSessionSelect, selectedSessionId]);

  const handleCreateSession = useCallback(() => {
    if (!isCreatingSession) onCreateNewSession();
    if (window.innerWidth < 1024) setIsExpanded(false);
  }, [onCreateNewSession, isCreatingSession]);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [sessions]);

  // Responsive handling
  useEffect(() => {
    const handleResize = () => setIsExpanded(window.innerWidth > 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity duration-300 lg:hidden ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={handleToggleExpanded}
      />

      {/* Mobile Toggle Button */}
      <button
        onClick={handleToggleExpanded}
        className={`fixed left-4 top-4 z-40 p-2 rounded-full bg-white dark:bg-[#0F1117] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white shadow-lg lg:hidden transition-all ${isExpanded ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Sidebar Container */}
      <aside
        ref={sidebarRef}
        className={`fixed lg:relative z-40 h-full w-72 bg-white/80 dark:bg-[#050a14]/95 backdrop-blur-xl border-r border-gray-200 dark:border-white/5 flex flex-col transition-transform duration-300 ease-out
                   ${isExpanded ? 'translate-x-0' : '-translate-x-full lg:w-0 lg:border-none lg:overflow-hidden'}
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-bold text-gray-800 dark:text-white tracking-wide">CodeQuest</h2>
          </div>

          <button
            onClick={handleCreateSession}
            disabled={isCreatingSession}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium text-gray-700 dark:text-white flex items-center justify-center gap-2 transition-all group"
          >
            {isCreatingSession ? (
              <Loader2 className="w-4 h-4 animate-spin text-teal-600 dark:text-teal-400" />
            ) : (
              <Plus className="w-4 h-4 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
            )}
            <span>New Chat</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-white/5 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-white/10">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-4 px-2">History</h3>

          {sortedSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-3">
                <FolderOpen className="w-5 h-5 text-gray-400 dark:text-gray-600" />
              </div>
              <p className="text-sm text-gray-500">No history yet</p>
            </div>
          ) : (
            sortedSessions.map((session, index) => (
              <SessionItem
                key={session.id}
                session={session}
                index={index}
                isSelected={selectedSessionId === session.id}
                onSelect={handleSessionSelect}
                onDelete={onDeleteSession}
              />
            ))
          )}
        </div>

        {/* User / Footer Area (Optional placeholder) */}
        <div className="p-4 border-t border-gray-200 dark:border-white/5">
          {/* Could add user profile snippet here */}
        </div>
      </aside>
    </>
  );
});
ChatSidebar.displayName = 'ChatSidebar';

export default ChatSidebar;
