import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { MessageCircle, Plus, CalendarDays, X, Loader2, Sparkles, FolderOpen } from "lucide-react";

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
  /** Owned by the parent so the open control can live in the header. */
  isOpen: boolean;
  onClose: () => void;
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
      className={`group mb-2 grid grid-cols-[1fr_auto] items-center rounded-xl transition-all duration-200
        ${isSelected
          ? "border border-primary/20 bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.1)]"
          : "border border-transparent hover:border-border hover:bg-white/5"
        }
        ${isDeleting ? "scale-95 opacity-50" : "opacity-100"}
      `}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <button
        onClick={handleSelect}
        disabled={isDeleting}
        className="flex min-h-[56px] min-w-0 items-center rounded-xl p-3 text-left focus:outline-none"
        title={displayName}
      >
        <div className={`mr-3 rounded-lg p-2 transition-colors ${isSelected ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"}`}>
          <MessageCircle className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`truncate text-sm font-medium ${isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
            {displayName}
          </p>
          <div className="mt-0.5 flex items-center text-[10px] text-muted-foreground">
            <CalendarDays className="w-3 h-3 mr-1" />
            <span>{relativeTime}</span>
          </div>
        </div>
      </button>

      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="mr-1 grid h-11 w-11 shrink-0 place-items-center rounded-lg
                  text-muted-foreground opacity-100 transition-all
                  hover:bg-destructive/10 hover:text-destructive
                  focus:opacity-100 focus:outline-none
                  sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        title="Delete Chat"
        aria-label={`Delete ${displayName}`}
      >
        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
      </button>
    </div>
  );
});
SessionItem.displayName = 'SessionItem';

/**
 * True at the lg breakpoint and up.
 *
 * Deliberately matchMedia rather than a window resize listener: on Android,
 * resize fires when the soft keyboard opens and when the URL bar hides during
 * scroll, and the previous implementation reset the drawer's open state on
 * every one of those events.
 */
function useIsDesktop(): boolean {
  const query = "(min-width: 1024px)";
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", onChange);
    setIsDesktop(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

const ChatSidebar: React.FC<ChatSidebarProps> = React.memo(({
  sessions,
  onSessionSelect,
  selectedSessionId,
  onCreateNewSession,
  onDeleteSession,
  isCreatingSession = false,
  isOpen,
  onClose,
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();

  // Selecting something on a phone should reveal the result, not leave the
  // drawer covering it.
  const handleSessionSelect = useCallback((sessionId: string) => {
    if (sessionId !== selectedSessionId) onSessionSelect(sessionId);
    if (!isDesktop) onClose();
  }, [onSessionSelect, selectedSessionId, isDesktop, onClose]);

  const handleCreateSession = useCallback(() => {
    if (!isCreatingSession) onCreateNewSession();
    if (!isDesktop) onClose();
  }, [onCreateNewSession, isCreatingSession, isDesktop, onClose]);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [sessions]);

  return (
    <>
      {/* Scrim behind the drawer on phones. */}
      <div
        className={`fixed inset-0 z-30 bg-black/65 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        ref={sidebarRef}
        aria-label="Chat history"
        aria-hidden={!isOpen && !isDesktop}
        className={`fixed lg:relative z-40 flex h-full w-[min(18rem,85vw)] flex-col border-r border-border bg-card/95 backdrop-blur-xl transition-transform duration-300 ease-out
                   ${isOpen ? 'translate-x-0' : '-translate-x-full lg:w-0 lg:overflow-hidden lg:border-none'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-border p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-primary to-secondary p-2">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="truncate font-bold tracking-wide text-foreground">CodeQuest</h2>
          </div>
          {/* Closing from inside the drawer: the header control is covered by
              the scrim while it is open. */}
          <button
            onClick={onClose}
            aria-label="Close chat history"
            className="-mr-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 pt-0 sm:pt-0">
          <button
            onClick={handleCreateSession}
            disabled={isCreatingSession}
            className="group flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-white/5 px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-white/10 disabled:opacity-60"
          >
            {isCreatingSession ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Plus className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
            )}
            <span>New Chat</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="scrollbar-thin scrollbar-thumb-white/5 hover:scrollbar-thumb-white/10 flex-1 overflow-y-auto px-4 py-4">
          <h3 className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">History</h3>

          {sortedSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No history yet</p>
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

      </aside>
    </>
  );
});
ChatSidebar.displayName = 'ChatSidebar';

export default ChatSidebar;
