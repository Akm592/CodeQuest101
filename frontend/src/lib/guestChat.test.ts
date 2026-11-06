import { describe, it, expect } from "vitest";
import {
  GUEST_CHAT_KEY,
  MAX_SAVED_MESSAGES,
  clearGuestChat,
  loadGuestChat,
  saveGuestChat,
} from "./guestChat";
import type { ChatMessage } from "../components/chatbot/types";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  };
}

const msg = (id: string, extra: Partial<ChatMessage> = {}): ChatMessage => ({
  id,
  sender: "bot",
  text: `text ${id}`,
  timestamp: "10:00",
  ...extra,
});

describe("guest chat persistence", () => {
  it("round-trips a chat", () => {
    const storage = memoryStorage();
    const pending = { kind: "awaiting_language" as const, slug: "two-sum", visualize: false };
    saveGuestChat(storage, { sessionId: "s1", messages: [msg("a")], pending });
    expect(loadGuestChat(storage)).toEqual({ sessionId: "s1", messages: [{ ...msg("a"), autoOpenSuggestion: false }], pending });
  });

  it("marks a reply cut off by the reload as stopped", () => {
    const storage = memoryStorage();
    saveGuestChat(storage, { sessionId: "s1", messages: [msg("a", { isStreaming: true })], pending: null });
    const [restored] = loadGuestChat(storage)!.messages;
    expect(restored.isStreaming).toBe(false);
    expect(restored.stopped).toBe(true);
  });

  it("does not re-open a visualization on reload", () => {
    const storage = memoryStorage();
    saveGuestChat(storage, { sessionId: "s1", messages: [msg("a", { autoOpenSuggestion: true })], pending: null });
    expect(loadGuestChat(storage)!.messages[0].autoOpenSuggestion).toBe(false);
  });

  it("keeps only the most recent messages", () => {
    const storage = memoryStorage();
    const many = Array.from({ length: MAX_SAVED_MESSAGES + 5 }, (_, i) => msg(String(i)));
    saveGuestChat(storage, { sessionId: "s1", messages: many, pending: null });
    const restored = loadGuestChat(storage)!.messages;
    expect(restored).toHaveLength(MAX_SAVED_MESSAGES);
    expect(restored[0].id).toBe("5");
  });

  it("ignores corrupt or foreign data", () => {
    const storage = memoryStorage();
    storage.setItem(GUEST_CHAT_KEY, "{not json");
    expect(loadGuestChat(storage)).toBeNull();
    storage.setItem(GUEST_CHAT_KEY, JSON.stringify({ sessionId: 1, messages: [] }));
    expect(loadGuestChat(storage)).toBeNull();
    storage.setItem(GUEST_CHAT_KEY, JSON.stringify({ sessionId: "s", messages: [{ junk: true }, msg("ok")] }));
    expect(loadGuestChat(storage)!.messages.map((m) => m.id)).toEqual(["ok"]);
  });

  it("survives storage that throws", () => {
    const broken = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    };
    expect(() => saveGuestChat(broken, { sessionId: "s", messages: [], pending: null })).not.toThrow();
    expect(loadGuestChat(broken)).toBeNull();
    expect(() => clearGuestChat(broken)).not.toThrow();
    expect(loadGuestChat(undefined)).toBeNull();
  });
});
