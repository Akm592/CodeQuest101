import React, { useState } from "react";
import { MessageCircle, Plus, CalendarDays, X, ChevronLeft, ChevronRight } from "lucide-react";

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
  initiallyExpanded?: boolean;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  onSessionSelect,
  selectedSessionId,
  onCreateNewSession,
  onDeleteSession,
  initiallyExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  // Format date - Relative Time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
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
  };

  // Determine a display name for the session
  const getSessionDisplayName = (session: ChatSessionInfo, index: number) => {
    const potentialDefaultName = `Chat ${index + 1}`;
    if (session.session_name && session.session_name !== potentialDefaultName && session.session_name.length > 3) {
      return session.session_name;
    }
    return `Chat (${formatRelativeTime(session.created_at)})`;
  };

  return (
    <div className="relative h-full">
      {/* Toggle Button (Visible when sidebar is collapsed) */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="absolute left-3 top-4 z-20 rounded-full p-2 bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-all duration-200"
          aria-label="Show sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
      
      <aside 
        className={`bg-white/20 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl m-2 
                   h-[calc(100%-1rem)] flex flex-col shadow-xl border border-white/10 
                   dark:border-white/5 overflow-hidden transition-all duration-300 ease-in-out
                   ${isExpanded ? 'w-72 opacity-100' : 'w-0 opacity-0'}`}
      >
        {/* Header */}
        <div className="p-5 flex-shrink-0 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-800 dark:text-gray-100 flex items-center">
            <span>Conversations</span>
          </h2>
          
          {/* Hide button */}
          <button
            onClick={() => setIsExpanded(false)}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
            aria-label="Hide sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

      {/* Sessions List */}
      <div className="flex-grow px-3 pb-3 pt-1 overflow-y-auto scrollbar-thin">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3 opacity-50" />
            <p className="text-sm font-medium">No Conversations Yet</p>
            <p className="text-xs mt-1">Start a new conversation below</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session, index) => (
              <div
                key={session.id}
                className={`group relative rounded-xl transition-all duration-200 overflow-hidden ${
                  selectedSessionId === session.id
                    ? "bg-blue-500/10 dark:bg-blue-600/20 ring-1 ring-blue-500/50 dark:ring-blue-400/30"
                    : "hover:bg-gray-500/5 dark:hover:bg-white/5"
                }`}
              >
                <button
                  onClick={() => onSessionSelect(session.id)}
                  className="w-full flex items-start p-3 text-left focus:outline-none"
                  aria-current={selectedSessionId === session.id ? "page" : undefined}
                  title={getSessionDisplayName(session, index)}
                >
                  <div className="mr-3 mt-1">
                    <MessageCircle className={`w-4 h-4 ${
                      selectedSessionId === session.id
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      selectedSessionId === session.id
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-gray-800 dark:text-gray-200"
                    }`}>
                      {getSessionDisplayName(session, index)}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <CalendarDays className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span>{formatRelativeTime(session.updated_at)}</span>
                    </div>
                  </div>
                </button>
                
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 dark:text-gray-500
                            opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
                            hover:bg-red-500/10 hover:text-red-500 dark:hover:bg-red-400/10 dark:hover:text-red-400
                            focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:opacity-100 transition-all duration-150"
                  aria-label={`Delete ${getSessionDisplayName(session, index)}`}
                  title="Delete Chat"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-3 mt-auto flex-shrink-0">
        <button
          onClick={onCreateNewSession}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 
                   text-white rounded-xl p-3 flex items-center justify-center space-x-2
                   hover:from-blue-600 hover:to-indigo-600 dark:hover:from-blue-700 dark:hover:to-indigo-700
                   focus:outline-none focus:ring-2 focus:ring-blue-400/50 dark:focus:ring-blue-500/50
                   shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">New Conversation</span>
        </button>
      </div>
    </aside>
    </div>
  );
};

export default ChatSidebar;