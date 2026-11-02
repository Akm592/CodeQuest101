// Server-Sent Events from POST /chat, parsed incrementally.
//
// The chat used to split each network chunk on "\n" and JSON.parse every
// `data:` line it saw. A chunk boundary can fall anywhere — inside a line,
// inside the JSON — and when it did, both halves failed to parse and the event
// was dropped without a trace. Long events (a big answer chunk, a scene) were
// the likeliest to straddle a boundary. This parser carries the unfinished tail
// over to the next chunk and only dispatches complete events.

export type ChatEvent =
  | { type: "text"; content: string }
  | { type: "pending"; data: unknown }
  | { type: "suggestions"; data: unknown; autoOpen: boolean }
  | { type: "visualization"; data: unknown }
  | { type: "error"; content: string };

export interface SseParser {
  /** Feed decoded text. Complete events are dispatched; the rest is kept. */
  push(chunk: string): void;
  /** The stream ended: dispatch anything still buffered. */
  end(): void;
}

function toEvent(json: unknown): ChatEvent | null {
  if (typeof json !== "object" || json === null) return null;
  const e = json as Record<string, unknown>;
  switch (e.type) {
    case "text":
      return typeof e.content === "string" ? { type: "text", content: e.content } : null;
    case "error":
      return { type: "error", content: typeof e.content === "string" ? e.content : "Something went wrong." };
    case "pending":
      return { type: "pending", data: e.data };
    case "suggestions":
      return { type: "suggestions", data: e.data, autoOpen: e.autoOpen === true };
    case "visualization":
      return { type: "visualization", data: e.data };
    default:
      // Unknown event types are ignored so the backend can add new ones
      // without breaking clients that predate them.
      return null;
  }
}

export function createSseParser(
  onEvent: (event: ChatEvent) => void,
  onBadEvent: (raw: string, error: unknown) => void = () => {},
): SseParser {
  let buffer = "";
  let dataLines: string[] = [];

  const dispatch = () => {
    if (dataLines.length === 0) return;
    const raw = dataLines.join("\n");
    dataLines = [];
    try {
      const event = toEvent(JSON.parse(raw));
      if (event) onEvent(event);
    } catch (error) {
      onBadEvent(raw, error);
    }
  };

  const line = (l: string) => {
    if (l === "") {
      dispatch(); // a blank line ends an event
    } else if (l.startsWith("data:")) {
      dataLines.push(l.slice(5).replace(/^ /, ""));
    }
    // Comments (":") and other fields (event:, id:, retry:) are not used.
  };

  return {
    push(chunk) {
      buffer += chunk;
      let newline: number;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        line(buffer.slice(0, newline).replace(/\r$/, ""));
        buffer = buffer.slice(newline + 1);
      }
    },
    end() {
      if (buffer) line(buffer.replace(/\r$/, ""));
      buffer = "";
      dispatch();
    },
  };
}
