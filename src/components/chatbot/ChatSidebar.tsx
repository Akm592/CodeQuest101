// ./src/components/chatbot/ChatSidebar.tsx
import React from "react";
import { LayoutList, MessageSquarePlus } from "lucide-react"; // icons

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
  return (
    <aside className="bg-gray-100 border-r border-gray-200 w-64 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
          <LayoutList className="w-4 h-4" />
          <span>Chat History</span>
        </h2>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        <nav className="space-y-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center">No chats yet.</p>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSessionSelect(session.id)}
                className={`w-full text-left p-2 rounded-md hover:bg-gray-200 focus:bg-gray-200 focus:outline-none ${
                  selectedSessionId === session.id
                    ? "bg-gray-200 font-semibold"
                    : ""
                }`}
              >
                {session.session_name ||
                  `Chat Session ${sessions.indexOf(session) + 1}`}{" "}
                {/* Display session name or default */}
                <p className="text-xs text-gray-500">
                  {new Date(session.updated_at).toLocaleDateString()}
                </p>{" "}
                {/* Display date */}
              </button>
            ))
          )}
        </nav>
      </div>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onCreateNewSession}
          className="w-full bg-blue-600 text-white rounded-md p-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>
    </aside>
  );
};

export default ChatSidebar;
