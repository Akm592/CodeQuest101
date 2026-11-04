// The full-screen player a visualization suggestion opens.
//
// Layout: the data structures on the left; on the right the current step's
// explanation, the variables in scope and the code with the executing line
// highlighted; playback controls along the bottom. Before the first step the
// right side shows the scene's summary, so opening it reads as "here's the
// idea, now watch it run" rather than an unexplained first frame.
//
// Keyboard handling is attached to the dialog, not the window. The old p5
// visualizer listened on the whole page, so typing a space in the chat box
// stepped every visualization in the conversation.

import { Info, Loader2, RotateCcw, Sparkles, X } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";

import { BEFORE_START, useAlgorithmPlayer } from "../../hooks/useAlgorithmPlayer";
import { fetchScene } from "../../lib/scene/fetchScene";
import { idsForSteps } from "../../lib/scene/identity";
import type { HighlightRole, Scene, TraceRequest, Variable } from "../../lib/scene/types";
import { cn } from "../../lib/utils";
import VisualizerControls from "../Visualizer/VisualizerControls";
import { CodePanel } from "./CodePanel";
import {
  ArrayView,
  BarsView,
  GridView,
  HashMapView,
  LinkedListView,
  QueueView,
  SetView,
  StackView,
} from "./renderers";
import { ROLE_CLASSES, ROLE_LABELS } from "./roles";

const RENDERERS = {
  array: ArrayView,
  bars: BarsView,
  hashmap: HashMapView,
  set: SetView,
  stack: StackView,
  queue: QueueView,
  linked_list: LinkedListView,
  grid: GridView,
} as const;

export type SceneSource =
  | { kind: "ready"; scene: Scene }
  /** Generate on open, from the conversation (and a specific trace, for old saved suggestions). */
  | { kind: "fetch"; context: string; trace?: TraceRequest };

interface ScenePlayerProps {
  title: string;
  source: SceneSource;
  onClose: () => void;
  /** Shown as a caution: these traces are written by the model. */
  aiGenerated?: boolean;
}

const MIN_DELAY = 400;
const MAX_DELAY = 4000;

// ---------------------------------------------------------------------------

const VariablesPanel: React.FC<{ variables: Variable[]; previous: Variable[] }> = ({ variables, previous }) => {
  if (variables.length === 0) return null;
  const before = new Map(previous.map((v) => [v.name, v.value]));
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Variables</h3>
      <ul className="flex flex-wrap gap-2">
        {variables.map((v) => {
          const changed = before.has(v.name) ? before.get(v.name) !== v.value : previous.length > 0;
          return (
            <li
              key={v.name}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 font-mono text-xs text-foreground transition-colors duration-300",
                changed ? "border-viz-compare bg-viz-compare/15" : "border-white/10 bg-white/[0.04]",
              )}
            >
              <span className="text-muted-foreground">{v.name}</span> = {v.value}
              {changed && <span className="sr-only"> (changed)</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

const SceneView: React.FC<{ scene: Scene; titleId: string }> = ({ scene, titleId }) => {
  const player = useAlgorithmPlayer(scene.steps, { initialDelayMs: 1800 });
  const index = player.index;
  // Before the first step, show the initial state under the overview.
  const shown = scene.steps[Math.max(index, 0)];
  const previous = index > 0 ? scene.steps[index - 1] : null;

  const ids = React.useMemo(() => {
    const out = new Map<string, string[][]>();
    for (const s of scene.structures) {
      out.set(
        s.id,
        idsForSteps(scene.steps.map((step) => step.states.find((st) => st.structure === s.id)?.items ?? null)),
      );
    }
    return out;
  }, [scene]);

  const rolesUsed = React.useMemo(() => {
    const roles = new Set<HighlightRole>();
    for (const step of scene.steps) for (const h of step.highlights ?? []) roles.add(h.role);
    return [...roles];
  }, [scene]);

  const drawable = scene.structures.filter((s) => s.type !== "variables");

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
          {/* The structures */}
          <div className="min-w-0 space-y-5 rounded-2xl border border-white/5 bg-black/30 p-4 sm:p-5">
            {drawable.map((spec) => {
              const Renderer = RENDERERS[spec.type as keyof typeof RENDERERS];
              const stepIndex = Math.max(index, 0);
              return (
                <section key={spec.id} aria-label={spec.label}>
                  <h3 className="mb-2 font-mono text-xs font-semibold text-viz-pointer">{spec.label}</h3>
                  <Renderer
                    structureId={spec.id}
                    state={shown.states.find((st) => st.structure === spec.id)}
                    highlights={index < 0 ? [] : (shown.highlights ?? []).filter((h) => h.structure === spec.id)}
                    pointers={(shown.pointers ?? []).filter((p) => p.structure === spec.id)}
                    ids={ids.get(spec.id)?.[stepIndex] ?? []}
                  />
                </section>
              );
            })}
            {rolesUsed.length > 0 && (
              <ul className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-white/5 pt-3" aria-label="Colour key">
                {rolesUsed.map((role) => (
                  <li key={role} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn("h-3 w-3 rounded-sm border", ROLE_CLASSES[role])} aria-hidden="true" />
                    {ROLE_LABELS[role]}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* What is happening, and why */}
          <div className="min-w-0 space-y-4">
            <section
              aria-live="polite"
              className="rounded-2xl border border-primary/30 bg-primary/[0.07] p-4"
            >
              {index === BEFORE_START ? (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">Overview</p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">
                    {scene.summary || "Press Play, or step through one operation at a time."}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {scene.steps.length} steps. Press Play, or use → and ← to step.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                    Step {index + 1} of {scene.steps.length}
                  </p>
                  <h3 className="mt-1.5 text-base font-semibold text-foreground">{shown.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{shown.explanation}</p>
                </>
              )}
            </section>

            <VariablesPanel variables={shown.variables ?? []} previous={previous?.variables ?? []} />

            {scene.code && (
              <CodePanel
                language={scene.code.language}
                lines={scene.code.lines}
                activeLine={index >= 0 ? shown.code_line : undefined}
              />
            )}
          </div>
        </div>
      </div>

      <footer className="shrink-0 border-t border-white/10 bg-card/80 p-3 sm:px-6 sm:py-4">
        <VisualizerControls
          status={player.status}
          onPlay={player.play}
          onPause={player.pause}
          onReset={player.reset}
          onStepForward={player.stepForward}
          onStepBack={player.stepBack}
          delayMs={player.delayMs}
          onDelayChange={player.setDelayMs}
          minDelayMs={MIN_DELAY}
          maxDelayMs={MAX_DELAY}
          stepMs={100}
          stepIndex={player.index}
          stepCount={player.stepCount}
        />
      </footer>

      <KeyboardShortcuts player={player} titleId={titleId} />
    </>
  );
};

/** Arrow keys step, space plays/pauses — only while focus is inside the dialog. */
const KeyboardShortcuts: React.FC<{
  player: ReturnType<typeof useAlgorithmPlayer<unknown>>;
  titleId: string;
}> = ({ player, titleId }) => {
  React.useEffect(() => {
    const dialog = document.getElementById(titleId)?.closest('[role="dialog"]');
    if (!dialog) return;
    const onKey = (e: Event) => {
      const event = e as KeyboardEvent;
      const target = event.target as HTMLElement;
      // Let buttons, sliders and fields handle their own keys.
      if (target.closest("button, input, textarea, select, [role='slider']")) return;
      if (event.key === "ArrowRight") player.stepForward();
      else if (event.key === "ArrowLeft") player.stepBack();
      else if (event.key === " ") player.toggle();
      else return;
      event.preventDefault();
    };
    dialog.addEventListener("keydown", onKey);
    return () => dialog.removeEventListener("keydown", onKey);
  }, [player, titleId]);
  return null;
};

// ---------------------------------------------------------------------------

/**
 * Contains a renderer that throws on data validation didn't anticipate.
 *
 * Without it, one bad frame unmounted the whole app: a blank page, with the
 * conversation gone from view. Now the player says so and can be closed.
 */
class SceneBoundary extends React.Component<
  { onClose: () => void; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Visualization failed to draw:", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="grid flex-1 place-items-center p-6 text-center" role="alert" data-scene-crashed="">
        <div className="max-w-sm">
          <p className="text-sm text-foreground">Couldn't draw this visualization: some of its data is malformed.</p>
          <button
            type="button"
            onClick={this.props.onClose}
            className="mt-4 inline-flex h-11 items-center rounded-xl border border-white/15 px-5 text-sm font-semibold text-foreground hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
}

// ---------------------------------------------------------------------------

export const ScenePlayer: React.FC<ScenePlayerProps> = ({ title, source, onClose, aiGenerated = true }) => {
  const titleId = React.useId();
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const [state, setState] = React.useState<
    | { status: "loading" }
    | { status: "ready"; scene: Scene }
    | { status: "declined"; reason: string }
    | { status: "error"; message: string }
  >(source.kind === "ready" ? { status: "ready", scene: source.scene } : { status: "loading" });
  const [attempt, setAttempt] = React.useState(0);

  // Load the scene (or reuse the cached request).
  // Keyed by value: a re-rendering parent passing an equal-but-new object
  // must not restart the request.
  const requestKey = source.kind === "fetch" ? JSON.stringify([source.context, source.trace ?? null]) : null;
  React.useEffect(() => {
    if (!requestKey) return;
    const [context, trace] = JSON.parse(requestKey) as [string, TraceRequest | null];
    let alive = true;
    setState({ status: "loading" });
    fetchScene(context, trace ?? undefined).then(
      (outcome) =>
        alive &&
        setState(
          outcome.feasible
            ? { status: "ready", scene: outcome.scene }
            : { status: "declined", reason: outcome.reason },
        ),
      (error: Error) => alive && setState({ status: "error", message: error.message }),
    );
    return () => {
      alive = false;
    };
  }, [requestKey, attempt]);

  // Modal behaviour: focus inside, Escape closes, page doesn't scroll behind,
  // and focus returns to the chip that opened it.
  React.useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [onClose]);

  const sceneTitle = state.status === "ready" ? state.scene.title : title;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-scene-player=""
        className="flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden border-white/10 bg-popover text-foreground outline-none sm:h-[92dvh] sm:rounded-2xl sm:border"
      >
        <header className="flex shrink-0 items-start gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
          <Sparkles className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-semibold leading-snug sm:text-lg">{sceneTitle}</h2>
            {aiGenerated && state.status === "ready" && (
              <p className="text-xs text-muted-foreground">AI-generated trace: check it against the code.</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close visualization"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {state.status === "loading" && (
          <div className="grid flex-1 place-items-center p-6 text-center" role="status">
            <div>
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" aria-hidden="true" />
              <p className="mt-3 text-sm text-foreground">Picking an example and tracing it step by step…</p>
              <p className="mt-1 text-xs text-muted-foreground">This usually takes 10–30 seconds.</p>
            </div>
          </div>
        )}

        {/* The model judged this can't be traced faithfully. Shown calmly,
            not as a failure: declining beats inventing an example. */}
        {state.status === "declined" && (
          <div className="grid flex-1 place-items-center p-6 text-center" data-scene-declined="">
            <div className="max-w-md">
              <Info className="mx-auto h-7 w-7 text-viz-pointer" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-foreground">This one can't be shown step by step</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{state.reason}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 inline-flex h-11 items-center rounded-xl border border-white/15 px-5 text-sm font-semibold text-foreground hover:bg-white/10"
              >
                Back to the chat
              </button>
            </div>
          </div>
        )}

        {state.status === "error" && (
          <div className="grid flex-1 place-items-center p-6 text-center" role="alert">
            <div className="max-w-sm">
              <p className="text-sm text-foreground">{state.message}</p>
              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <RotateCcw className="h-4 w-4" /> Try again
              </button>
            </div>
          </div>
        )}

        {state.status === "ready" && (
          <SceneBoundary onClose={onClose}>
            <SceneView scene={state.scene} titleId={titleId} />
          </SceneBoundary>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default ScenePlayer;
