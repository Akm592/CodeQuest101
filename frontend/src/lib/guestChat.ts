/**
 * A guest's chat, kept across a page refresh.
 *
 * Guests have no stored history, so a refresh used to wipe the conversation.
 * It is kept in sessionStorage: it survives a reload but not closing the tab,
 * which matches what "guest" promises. Every access is guarded, because
 * storage can be missing or throw (private mode, blocked site data).
 */
import type { ChatMessage } from "../components/chatbot/types";
import type { PendingContext } from "./api";

export const GUEST_CHAT_KEY = "codequest.guestChat.v1";
/** Enough for a long session without approaching the storage quota. */
export const MAX_SAVED_MESSAGES = 60;

export interface GuestChat {
  sessionId: string;
  messages: ChatMessage[];
  pending: PendingContext | null;
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function browserSessionStorage(): StorageLike | undefined {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : undefined;
  } catch {
    return undefined;
  }
}

/** A message as it should come back after a reload. */
function forStorage(message: ChatMessage): ChatMessage {
  const saved: ChatMessage = { ...message, autoOpenSuggestion: false };
  if (saved.isStreaming) {
    // The page went away mid-reply: what arrived is all there is.
    saved.isStreaming = false;
    saved.stopped = true;
  }
  return saved;
}

export function saveGuestChat(storage: StorageLike | undefined, chat: GuestChat): void {
  if (!storage) return;
  const payload: GuestChat = {
    sessionId: chat.sessionId,
    messages: chat.messages.slice(-MAX_SAVED_MESSAGES).map(forStorage),
    pending: chat.pending,
  };
  try {
    storage.setItem(GUEST_CHAT_KEY, JSON.stringify(payload));
  } catch {
    // Quota or blocked storage: the chat still works, it just won't survive a reload.
  }
}

function isMessage(value: unknown): value is ChatMessage {
  const m = value as ChatMessage;
  return (
    !!m &&
    typeof m.id === "string" &&
    (m.sender === "user" || m.sender === "bot") &&
    typeof m.text === "string"
  );
}

export function loadGuestChat(storage: StorageLike | undefined): GuestChat | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(GUEST_CHAT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GuestChat>;
    if (typeof parsed.sessionId !== "string" || !Array.isArray(parsed.messages)) return null;
    const pending =
      parsed.pending && parsed.pending.kind === "awaiting_language" && typeof parsed.pending.slug === "string"
        ? parsed.pending
        : null;
    return { sessionId: parsed.sessionId, messages: parsed.messages.filter(isMessage), pending };
  } catch {
    return null;
  }
}

export function clearGuestChat(storage: StorageLike | undefined): void {
  try {
    storage?.removeItem(GUEST_CHAT_KEY);
  } catch {
    // Nothing to do: storage is unavailable.
  }
}
