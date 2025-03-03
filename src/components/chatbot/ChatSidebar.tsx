// ./src/components/chatbot/ChatSidebar.tsx

import React from "react";
import { LayoutList, MessageSquarePlus, Clock } from "lucide-react"; // Added Clock icon

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
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  onSessionSelect,
  selectedSessionId,
  onCreateNewSession,
}) => {
  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if date is today
    if (date.toDateString() === now.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
    // Check if date is yesterday
    else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
    // Otherwise return formatted date
    else {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  return (
    <aside className="bg-white border-r border-gray-200 w-72 h-full flex flex-col shadow-sm">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
          <LayoutList className="w-4 h-4" />
          <span>Chat History</span>
        </h2>
      </div>

      <div className="flex-grow p-2 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <LayoutList className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No chat history yet.</p>
            <p className="text-xs text-gray-400 mt-1">Start a new conversation!</p>
          </div>
        ) : (
          <nav className="space-y-1">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSessionSelect(session.id)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                  selectedSessionId === session.id
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : "border-l-4 border-transparent"
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`font-medium text-gray-800 ${selectedSessionId === session.id ? "text-blue-600" : ""}`}>
                    {session.session_name || `Chat ${sessions.indexOf(session) + 1}`}
                  </span>
                </div>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{formatDate(session.updated_at)}</span>
                </div>
              </button>
            ))}
          </nav>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 bg-gray-50">
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