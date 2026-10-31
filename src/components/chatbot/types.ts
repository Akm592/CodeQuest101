import type { Suggestion } from "../../lib/scene/types";

/** One message in the chat. Shared by chatBot, ChatWindow and MessageBubble. */
export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  /** A visualization saved by the old backend, drawn by the legacy adapter or the p5 renderer. */
  isVisualization?: boolean;
  visualizationData?: unknown;
  isStreaming?: boolean;
  /** Visualizations offered under this answer. */
  suggestions?: Suggestion[];
  /** The question and answer a suggestion came from, sent along when it's opened. */
  vizContext?: string;
  /** Open the first suggestion as soon as it arrives (the user asked to visualize). */
  autoOpenSuggestion?: boolean;
}

/** What the scene generator is told about the conversation. */
export function buildVizContext(question: string, answer: string): string {
  return `Question: ${question}\n\nAnswer:\n${answer}`;
}
