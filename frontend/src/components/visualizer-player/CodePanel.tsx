// The code being traced, with the line the current step executes highlighted.
//
// Scrolls only its own box to keep that line in view. scrollIntoView would
// also scroll every ancestor, which inside the modal means yanking the whole
// player around on each step.

import * as React from "react";

import { cn } from "../../lib/utils";

interface CodePanelProps {
  language: string;
  lines: string[];
  activeLine?: number;
}

export const CodePanel: React.FC<CodePanelProps> = ({ language, lines, activeLine }) => {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const lineRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    const box = boxRef.current;
    const line = activeLine ? lineRefs.current[activeLine - 1] : null;
    if (!box || !line) return;
    const top = line.offsetTop;
    const bottom = top + line.offsetHeight;
    if (top < box.scrollTop) box.scrollTop = top - 8;
    else if (bottom > box.scrollTop + box.clientHeight) box.scrollTop = bottom - box.clientHeight + 8;
  }, [activeLine]);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
      <div className="border-b border-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {language}
      </div>
      <div ref={boxRef} className="relative max-h-64 overflow-auto py-2 font-mono text-xs leading-relaxed">
        {lines.map((line, i) => {
          const active = activeLine === i + 1;
          return (
            <div
              key={i}
              ref={(el) => (lineRefs.current[i] = el)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "flex min-w-max border-l-2 pr-3 transition-colors duration-200",
                active ? "border-primary bg-primary/15 text-foreground" : "border-transparent text-foreground/80",
              )}
            >
              <span className="w-9 shrink-0 select-none pr-3 text-right text-muted-foreground">{i + 1}</span>
              <span className="whitespace-pre">{line || " "}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CodePanel;
