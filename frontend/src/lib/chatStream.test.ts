import { describe, expect, it } from "vitest";

import { createSseParser, type ChatEvent } from "./chatStream";

const sse = (payload: unknown) => `data: ${JSON.stringify(payload)}\n\n`;

const STREAM =
  sse({ type: "text", content: "Use a hash map — “complement” lookups. 🙂" }) +
  sse({ type: "text", content: "\nsecond line with } and \" in it" }) +
  sse({ type: "pending", data: { kind: "awaiting_language", slug: "two-sum", visualize: false } }) +
  sse({
    type: "suggestions",
    autoOpen: true,
    data: [{ title: "Hash map lookup", kind: "trace", trace: { problem: "p", input: "i", approach: "a" } }],
  }) +
  sse({ type: "error", content: "The AI model didn't respond." });

function parseAll(chunks: string[]): ChatEvent[] {
  const events: ChatEvent[] = [];
  const parser = createSseParser((e) => events.push(e));
  for (const c of chunks) parser.push(c);
  parser.end();
  return events;
}

describe("createSseParser", () => {
  const whole = parseAll([STREAM]);

  it("parses every event type the backend sends", () => {
    expect(whole.map((e) => e.type)).toEqual(["text", "text", "pending", "suggestions", "error"]);
    expect(whole[3]).toMatchObject({ type: "suggestions", autoOpen: true });
  });

  // The bug this replaces: a chunk boundary inside a line dropped the event.
  it("gives identical events wherever the stream is split", () => {
    for (let at = 1; at < STREAM.length; at++) {
      expect(parseAll([STREAM.slice(0, at), STREAM.slice(at)]), `split at ${at}`).toEqual(whole);
    }
  });

  it("copes with the stream arriving one character at a time", () => {
    expect(parseAll([...STREAM])).toEqual(whole);
  });

  it("handles CRLF line endings", () => {
    expect(parseAll([STREAM.replace(/\n/g, "\r\n")])).toEqual(whole);
  });

  it("dispatches a final event that lacks its trailing blank line", () => {
    const events = parseAll([`data: ${JSON.stringify({ type: "text", content: "end" })}`]);
    expect(events).toEqual([{ type: "text", content: "end" }]);
  });

  it("ignores unknown event types and reports malformed JSON without throwing", () => {
    const bad: string[] = [];
    const events: ChatEvent[] = [];
    const parser = createSseParser((e) => events.push(e), (raw) => bad.push(raw));
    parser.push(sse({ type: "telemetry", n: 1 }) + "data: {oops\n\n" + sse({ type: "text", content: "ok" }));
    parser.end();
    expect(events).toEqual([{ type: "text", content: "ok" }]);
    expect(bad).toEqual(["{oops"]);
  });

  it("defaults autoOpen to false", () => {
    expect(parseAll([sse({ type: "suggestions", data: [] })])[0]).toEqual({
      type: "suggestions",
      data: [],
      autoOpen: false,
    });
  });
});
