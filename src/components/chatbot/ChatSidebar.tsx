import React from "react";
import { LayoutList, MessageSquarePlus, Clock, Trash2 } from "lucide-react";

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
  onDeleteSession: (sessionId: string) => void; // Added prop for delete action
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  onSessionSelect,
  selectedSessionId,
  onCreateNewSession,
  onDeleteSession,
}) => {
  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  return (
    <aside className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-72 h-full flex flex-col shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
          <LayoutList className="w-4 h-4" />
          <span>Chat History</span>
        </h2>
      </div>

      <div className="flex-grow p-2 overflow-y-auto hide-scrollbar">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <LayoutList className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No chat history yet.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start a new conversation!</p>
          </div>
        ) : (
          <nav className="space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                  selectedSessionId === session.id
                    ? "bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500 dark:border-blue-400 shadow-sm"
                    : "border-l-4 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <button
                  onClick={() => onSessionSelect(session.id)}
                  className="flex-1 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  aria-selected={selectedSessionId === session.id}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`font-medium text-gray-800 dark:text-gray-200 truncate ${
                        selectedSessionId === session.id ? "text-blue-600 dark:text-blue-300" : ""
                      }`}
                    >
                      {session.session_name || `Chat ${sessions.indexOf(session) + 1}`}
                    </span>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 ml-2">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{formatDate(session.updated_at)}</span>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => onDeleteSession(session.id)}
                  className="ml-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 focus:outline-none"
                  aria-label={`Delete chat ${session.session_name || `Chat ${sessions.indexOf(session) + 1}`}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </nav>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <button
          onClick={onCreateNewSession}
          className="w-full bg-blue-600 text-white rounded-lg p-3 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>
    </aside>
  );
};

export default ChatSidebar;