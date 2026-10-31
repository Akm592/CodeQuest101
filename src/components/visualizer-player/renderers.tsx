// One renderer per data structure type.
//
// The old p5 renderer drew every type as the same boxes on a white canvas and
// jumped between steps. These are DOM, styled with the app's viz-* tokens, and
// each element is keyed by a stable identity (lib/scene/identity.ts) so
// framer-motion's layout animation can *move* it: a swap slides two bars past
// each other, a pop lifts the top of the stack off, a dequeue shifts the queue
// left. Text stays real text, so it is selectable and the contrast checker can
// measure it.

import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";

import type { Entry, Highlight, HighlightRole, Pointer, StructureState } from "../../lib/scene/types";
import { PRIORITY, ROLE_CLASSES } from "./roles";
import { cn } from "../../lib/utils";

const spring = { type: "spring", stiffness: 420, damping: 34 } as const;

export interface RendererProps {
  /** Scopes animation ids, so `i` on two different arrays never cross over. */
  structureId: string;
  state: StructureState | undefined;
  highlights: Highlight[];
  pointers: Pointer[];
  /** Stable identities for `state.items`, parallel to it. */
  ids: string[];
}

function roleOf(highlights: Highlight[], target: string): HighlightRole | null {
  const roles = highlights.filter((h) => h.target === target).map((h) => h.role);
  return PRIORITY.find((r) => roles.includes(r)) ?? null;
}

function tagOf(highlights: Highlight[], target: string): string | undefined {
  return highlights.find((h) => h.target === target && h.label)?.label;
}

const Empty: React.FC<{ children?: React.ReactNode }> = ({ children = "empty" }) => (
  <p className="py-3 text-xs italic text-muted-foreground">({children})</p>
);

const Cell: React.FC<{
  role: HighlightRole | null;
  className?: string;
  children: React.ReactNode;
}> = ({ role, className, children }) => (
  <div
    className={cn(
      "grid min-h-11 min-w-11 place-items-center rounded-lg border px-2 font-mono text-sm text-foreground transition-colors duration-300",
      ROLE_CLASSES[role ?? "none"],
      className,
    )}
  >
    {children}
  </div>
);

/** Named pointers (i, left, slow…) sitting above an index. */
const PointerTags: React.FC<{ scope: string; names: string[] }> = ({ scope, names }) => (
  <div className="flex h-9 flex-col items-center justify-end">
    {names.map((name) => (
      <motion.span
        key={name}
        layoutId={`ptr-${scope}-${name}`}
        transition={spring}
        className="font-mono text-[11px] font-bold leading-tight text-viz-pointer"
      >
        {name}
        <span aria-hidden="true" className="block text-center leading-none">▼</span>
      </motion.span>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// array: boxes with indices, pointers above
// ---------------------------------------------------------------------------

export const ArrayView: React.FC<RendererProps> = ({ structureId, state, highlights, pointers }) => {
  const items = state?.items ?? [];
  if (items.length === 0) return <Empty />;
  return (
    <div className="overflow-x-auto pb-1">
      <ol className="flex w-max gap-1.5">
        {items.map((value, i) => {
          const target = String(i);
          const tag = tagOf(highlights, target);
          return (
            <li key={i} className="flex flex-col items-center">
              <PointerTags scope={structureId} names={pointers.filter((p) => p.target === target).map((p) => p.name)} />
              <Cell role={roleOf(highlights, target)}>{value}</Cell>
              <span className="mt-1 font-mono text-[10px] text-muted-foreground">{i}</span>
              {tag && <span className="mt-0.5 max-w-16 text-center text-[10px] leading-tight text-viz-compare">{tag}</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

// ---------------------------------------------------------------------------
// bars: numeric values as bars; swaps slide
// ---------------------------------------------------------------------------

export const BarsView: React.FC<RendererProps> = ({ state, highlights, pointers, ids }) => {
  const items = state?.items ?? [];
  if (items.length === 0) return <Empty />;
  const values = items.map(Number);
  const max = Math.max(...values.map(Math.abs), 1);
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex h-48 w-max min-w-full items-end gap-1.5 sm:h-56">
        {items.map((value, i) => {
          const target = String(i);
          const role = roleOf(highlights, target);
          const names = pointers.filter((p) => p.target === target).map((p) => p.name);
          return (
            <motion.div
              key={ids[i] ?? i}
              layout
              transition={spring}
              className="flex h-full w-9 flex-col items-center justify-end sm:w-11"
            >
              {names.length > 0 && (
                <span className="mb-0.5 font-mono text-[11px] font-bold text-viz-pointer">{names.join(",")}</span>
              )}
              <span className="mb-1 font-mono text-xs text-foreground">{value}</span>
              <div
                className={cn("w-full rounded-t-md border transition-colors duration-300", ROLE_CLASSES[role ?? "none"])}
                style={{ height: `${Math.max(4, (Math.abs(values[i]) / max) * 78)}%` }}
              />
            </motion.div>
          );
        })}
      </div>
      <div className="mt-1 flex w-max gap-1.5">
        {items.map((_, i) => (
          <span key={i} className="w-9 text-center font-mono text-[10px] text-muted-foreground sm:w-11">{i}</span>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// hashmap: key -> value rows; inserts fade in, removals fade out
// ---------------------------------------------------------------------------

export const HashMapView: React.FC<RendererProps> = ({ state, highlights }) => {
  const entries: Entry[] = state?.entries ?? [];
  return (
    <div>
      {entries.length === 0 && <Empty>empty map</Empty>}
      <ul className="flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {entries.map(({ key, value }) => (
            <motion.li
              key={key}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={spring}
            >
              <div
                className={cn(
                  "flex items-stretch overflow-hidden rounded-lg border font-mono text-sm transition-colors duration-300",
                  ROLE_CLASSES[roleOf(highlights, key) ?? "none"],
                )}
              >
                <span className="px-2.5 py-2 text-foreground">{key}</span>
                <span className="border-l border-white/10 bg-black/20 px-2.5 py-2 text-secondary-bright">{value}</span>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
};

// ---------------------------------------------------------------------------
// set: members as chips
// ---------------------------------------------------------------------------

export const SetView: React.FC<RendererProps> = ({ state, highlights, ids }) => {
  const items = state?.items ?? [];
  return (
    <div>
      {items.length === 0 && <Empty>empty set</Empty>}
      <ul className="flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {items.map((value, i) => (
            <motion.li
              key={ids[i] ?? value}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={spring}
            >
              <Cell role={roleOf(highlights, String(i))} className="rounded-full">{value}</Cell>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
};

// ---------------------------------------------------------------------------
// stack: bottom to top, drawn top-down; push drops in, pop lifts off
// ---------------------------------------------------------------------------

export const StackView: React.FC<RendererProps> = ({ state, highlights, ids }) => {
  const items = state?.items ?? [];
  const order = items.map((value, i) => ({ value, i })).reverse();
  return (
    <div className="flex items-end gap-3">
      <div className="flex w-28 flex-col items-stretch gap-1.5 rounded-b-xl border-x-2 border-b-2 border-white/15 p-1.5">
        {items.length === 0 && <Empty />}
        <AnimatePresence initial={false}>
          {order.map(({ value, i }) => (
            <motion.div
              key={ids[i] ?? i}
              layout
              initial={{ opacity: 0, y: -24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={spring}
            >
              <Cell role={roleOf(highlights, String(i))}>{value}</Cell>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {items.length > 0 && <span className="mb-auto mt-2 text-[11px] font-semibold text-viz-pointer">← top</span>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// queue: front on the left; enqueue enters right, dequeue leaves left
// ---------------------------------------------------------------------------

export const QueueView: React.FC<RendererProps> = ({ state, highlights, ids }) => {
  const items = state?.items ?? [];
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex w-max items-center gap-2">
        <span className="text-[11px] font-semibold text-viz-pointer">front</span>
        <div className="flex min-h-14 min-w-24 items-center gap-1.5 rounded-xl border-y-2 border-white/15 px-1.5">
          {items.length === 0 && <Empty />}
          <AnimatePresence initial={false}>
            {items.map((value, i) => (
              <motion.div
                key={ids[i] ?? i}
                layout
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={spring}
              >
                <Cell role={roleOf(highlights, String(i))}>{value}</Cell>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <span className="text-[11px] font-semibold text-viz-pointer">back</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// linked list: nodes joined by arrows, ending in null
// ---------------------------------------------------------------------------

export const LinkedListView: React.FC<RendererProps> = ({ structureId, state, highlights, pointers, ids }) => {
  const items = state?.items ?? [];
  return (
    <div className="overflow-x-auto pb-1">
      <ol className="flex w-max items-end">
        {items.length === 0 && <Empty>empty list</Empty>}
        {items.map((value, i) => {
          const target = String(i);
          return (
            <motion.li key={ids[i] ?? i} layout transition={spring} className="flex items-end">
              <div className="flex flex-col items-center">
                <PointerTags scope={structureId} names={pointers.filter((p) => p.target === target).map((p) => p.name)} />
                <Cell role={roleOf(highlights, target)} className="rounded-full">{value}</Cell>
              </div>
              <span aria-hidden="true" className="mb-3 px-1.5 text-muted-foreground">→</span>
            </motion.li>
          );
        })}
        {items.length > 0 && <li className="mb-3 font-mono text-xs text-muted-foreground">null</li>}
      </ol>
    </div>
  );
};

// ---------------------------------------------------------------------------
// grid: matrices and DP tables, addressed as "row,col"
// ---------------------------------------------------------------------------

export const GridView: React.FC<RendererProps> = ({ state, highlights, pointers }) => {
  const rows = state?.rows ?? [];
  if (rows.length === 0) return <Empty />;
  const width = Math.max(...rows.map((r) => r.cells.length));
  return (
    <div className="overflow-x-auto pb-1">
      <table className="border-separate border-spacing-1">
        <thead>
          <tr>
            <th />
            {Array.from({ length: width }, (_, c) => (
              <th key={c} className="font-mono text-[10px] font-normal text-muted-foreground">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              <th className="pr-1 font-mono text-[10px] font-normal text-muted-foreground">{r}</th>
              {row.cells.map((value, c) => {
                const target = `${r},${c}`;
                const names = pointers.filter((p) => p.target === target).map((p) => p.name);
                return (
                  <td key={c} className="p-0">
                    <Cell role={roleOf(highlights, target)} className="relative h-10 min-w-10">
                      {value}
                      {names.length > 0 && (
                        <span className="absolute -top-1.5 right-0.5 font-mono text-[9px] font-bold text-viz-pointer">
                          {names.join(",")}
                        </span>
                      )}
                    </Cell>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
