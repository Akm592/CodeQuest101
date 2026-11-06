import React from "react";
import { Sparkles } from "lucide-react";

/**
 * The empty chat: what the tutor does, and a few questions to start with.
 *
 * It replaces a copy of the visualizer catalogue ("Algorithm Visualizer" and
 * six category cards), which described a different page and on a phone
 * scrolled its own heading out of view.
 */
const STARTERS: { title: string; hint: string; prompt: string }[] = [
  { title: "Solve Two Sum", hint: "A LeetCode problem, explained and coded", prompt: "Solve Two Sum in Python" },
  { title: "Explain binary search", hint: "The idea, on a small example", prompt: "Explain binary search with a small example" },
  { title: "Visualize bubble sort", hint: "Watch it run step by step", prompt: "Visualize bubble sort on [5, 1, 4, 2, 8]" },
  { title: "DP or greedy?", hint: "When each one is the right tool", prompt: "When should I use dynamic programming instead of greedy?" },
];

const ChatWelcome: React.FC<{ onPick: (prompt: string) => void }> = ({ onPick }) => (
  <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col items-center justify-center px-2 py-6 text-center">
    <div className="grid h-12 w-12 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
      <Sparkles className="h-6 w-6" aria-hidden="true" />
    </div>
    <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
      What do you want to learn?
    </h2>
    <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
      Ask about any algorithm or data structure, or name a LeetCode problem by title, number or link.
    </p>
    <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
      {STARTERS.map((starter) => (
        <button
          key={starter.title}
          type="button"
          onClick={() => onPick(starter.prompt)}
          className="min-h-11 rounded-xl border border-border bg-card/60 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-card"
        >
          <span className="block text-sm font-medium text-foreground">{starter.title}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{starter.hint}</span>
        </button>
      ))}
    </div>
  </div>
);

export default ChatWelcome;
