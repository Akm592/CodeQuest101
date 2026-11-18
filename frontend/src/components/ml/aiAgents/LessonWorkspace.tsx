import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import type { AgentLesson, AgentLessonView } from "../../../lib/aiAgents/curriculum";
import { AGENT_SCENARIOS, AGENT_TOOLS, POLICY_TOPICS, getScenarioConfig } from "../../../lib/aiAgents/data";
import { runAgentSimulation, runToolSandbox } from "../../../lib/aiAgents/engine";
import type { AgentConfig, AgentEvent, AgentRun, ScenarioId, ToolId } from "../../../lib/aiAgents/types";
import { useAlgorithmPlayer } from "../../../hooks/useAlgorithmPlayer";
import { VisualizerControls } from "../../Visualizer/VisualizerControls";
import { Button } from "../../ui/button";
import { AgentFlow, ToolCanvas } from "./AgentCanvas";
import "./workspace.css";

interface Props {
  lesson: AgentLesson;
  view: AgentLessonView;
  builderConfig: AgentConfig;
  onBuilderConfigChange: (config: AgentConfig) => void;
  onViewChange: (view: AgentLessonView) => void;
}

const EMPTY_EVENTS: AgentEvent[] = [];
const taskLabels = { eligibility: "Check return eligibility", "return-draft": "Create a return draft", stock: "Check inventory", policy: "Answer a policy question" };
const faults = { none: "No failure", "timeout-once": "First read times out", "always-timeout": "Reads keep timing out", "invalid-arguments": "Invalid first request", "lost-response": "Draft created, response lost" };
const statusLabels = { completed: "Completed", needs_input: "Needs information", blocked: "Blocked", failed: "Failed", limit_reached: "Attempt limit reached" };
const lessonScenarios: Record<string, ScenarioId[]> = {
  comparison: ["eligible-return", "missing-order"],
  contract: ["invalid-arguments", "eligible-return", "unknown-order"],
  loop: ["eligible-return", "used-item", "expired-return", "missing-order"],
  context: ["follow-up"],
  memory: ["memory-preference"],
  validation: ["invalid-arguments", "unknown-order", "used-item"],
  retries: ["tool-timeout", "eligible-return"],
  idempotency: ["lost-response"],
  retrieval: ["eligible-return", "missing-policy"],
};

function Select<T extends string | number>({ label, value, options, change }: {
  label: string; value: T; options: readonly (readonly [T, string])[]; change: (value: T) => void;
}) {
  return <label>{label}<select value={value} onChange={event => {
    const option = options.find(([candidate]) => String(candidate) === event.target.value);
    if (option) change(option[0]);
  }}>{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>;
}

function Json({ value }: { value: unknown }) {
  return <pre>{JSON.stringify(value, null, 2)}</pre>;
}

function ToolSandbox() {
  const [id, setId] = useState<ToolId>("lookup_order");
  const tool = AGENT_TOOLS.find(item => item.id === id)!;
  const [input, setInput] = useState(() => JSON.stringify(tool.exampleInput, null, 2));
  const [result, setResult] = useState<Awaited<ReturnType<typeof runToolSandbox>>>();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function execute() {
    setPending(true);
    setError("");
    setResult(undefined);
    try {
      const args: unknown = JSON.parse(input);
      setResult(await runToolSandbox(id, args));
    } catch (error) {
      setError(error instanceof SyntaxError ? "Enter valid JSON before running the tool." : "This sample tool could not complete.");
    } finally {
      setPending(false);
    }
  }

  return <details className="agent-sandbox">
    <summary>Try sending tool arguments</summary>
    <fieldset className="agent-settings" disabled={pending}>
      <legend className="sr-only">Tool sandbox inputs</legend>
      <Select label="Tool to test" value={id} options={AGENT_TOOLS.map(item => [item.id, item.name])} change={next => {
        setId(next);
        setInput(JSON.stringify(AGENT_TOOLS.find(item => item.id === next)!.exampleInput, null, 2));
        setResult(undefined);
        setError("");
      }} />
      <label>Tool arguments (JSON)<textarea value={input} spellCheck={false} onChange={event => {
        setInput(event.target.value); setResult(undefined); setError("");
      }} /></label>
      <Button size="sm" disabled={pending} onClick={() => void execute()}>{pending ? "Executing…" : "Execute tool"}</Button>
    </fieldset>
    {error && <p role="alert">{error}</p>}
    {result && <div aria-live="polite"><p>{result.result.ok ? "Tool returned a result." : result.result.error?.message}</p><Json value={result.result} /></div>}
  </details>;
}

function LessonNote({ lesson }: { lesson: AgentLesson }) {
  return <>
    <details><summary>Developer’s reasoning</summary><p>{lesson.inspector.why}</p><p>{lesson.inspector.pitfall}</p></details>
    <details><summary>Logic &amp; pseudocode</summary><p>{lesson.inspector.math}</p><pre>{lesson.inspector.pseudocode}</pre></details>
    <details><summary>Further reading</summary><ul>{lesson.sources.map(source =>
      <li key={source.url}><a href={source.url}>{source.title}</a></li>
    )}</ul></details>
  </>;
}

export default function LessonWorkspace({ lesson, view, builderConfig, onBuilderConfigChange, onViewChange }: Props) {
  const [answer, setAnswer] = useState<number>();
  const [localConfig, setLocalConfig] = useState(() => getScenarioConfig(lesson.defaultScenarioId, { taskPreset: lesson.defaultTaskPreset }));
  const [saved, setSaved] = useState<{ config: AgentConfig; run: AgentRun }>();
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState("");
  const [toolId, setToolId] = useState<ToolId>();
  const [panel, setPanel] = useState<"canvas" | "inspector" | "history">("canvas");
  const [approach, setApproach] = useState<"agent" | "chatbot" | "workflow">("agent");
  const [builderPane, setBuilderPane] = useState<"connections" | "execution">("connections");
  const builder = lesson.id === "builder";
  const trying = view === "try";
  const config = builder ? builderConfig : localConfig;
  const setConfig = builder ? onBuilderConfigChange : setLocalConfig;
  const run = saved?.config === config ? saved.run : undefined;
  const events = run?.events ?? EMPTY_EVENTS;
  const player = useAlgorithmPlayer(events, { initialDelayMs: 950 });
  const event = player.current ?? undefined;
  const chosenTool = AGENT_TOOLS.find(tool => tool.id === (toolId ?? event?.toolId ?? (lesson.id === "contract" ? "lookup_order" : undefined)));
  const activeRun = view === "watch" || trying;
  const visiblePanel = !activeRun && panel === "history" ? "canvas" : panel;
  const pause = player.pause;
  useEffect(() => { if (!activeRun) pause(); }, [activeRun, pause]);

  function change(next: Partial<AgentConfig>) {
    setConfig({ ...config, ...next });
    setFailure("");
  }

  async function start() {
    setPending(true);
    setSaved(undefined);
    setFailure("");
    setToolId(undefined);
    player.reset();
    try {
      setSaved({ config, run: await runAgentSimulation(config) });
      if (builder) setBuilderPane("execution");
    } catch {
      setFailure("The simulation could not run. Try running the sample again.");
    } finally {
      setPending(false);
    }
  }

  function toggle(id: ToolId) {
    change({ enabledTools: config.enabledTools.includes(id) ? config.enabledTools.filter(tool => tool !== id) : [...config.enabledTools, id] });
  }

  let story: ReactNode;
  if (view === "understand") {
    story = <article className="course-understand">
      <BookOpen size={26} /><h2>{lesson.title}</h2>
      {lesson.idea.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      <Button onClick={() => onViewChange("watch")}>Watch the steps <ArrowRight size={16} /></Button>
    </article>;
  } else if (view === "check") {
    story = <article className="course-quiz">
      <CheckCircle2 size={26} /><h2>{lesson.check.prompt}</h2>
      <fieldset><legend className="sr-only">Choose an answer</legend>
        {lesson.check.options.map((option, index) => <label key={option}>
          <input type="radio" name={"quiz-" + lesson.id} checked={answer === index} onChange={() => setAnswer(index)} />{option}
        </label>)}
      </fieldset>
      {answer !== undefined && <p role="status"><strong>{answer === lesson.check.correctIndex ? "Correct. " : "Consider the explanation. "}</strong>{lesson.check.explanation}</p>}
    </article>;
  }

  const comparison = lesson.id === "comparison";
  const fixed = comparison && approach !== "agent";
  const taskOptions = Object.entries(taskLabels) as [AgentConfig["taskPreset"], string][];
  const faultOptions = Object.entries(faults) as [AgentConfig["fault"], string][];
  const optionMode = lesson.id === "context" || builder;
  const optionLimits = lesson.id === "retries" || lesson.id === "idempotency" || builder;
  const availableScenarios = AGENT_SCENARIOS.filter(item => builder || lessonScenarios[lesson.id]?.includes(item.id));
  const completion = event?.kind === "completion" ? run : undefined;
  const citationIds = new Set(completion?.claims.flatMap(claim => claim.evidenceIds));
  const citedPassages = event?.snapshot.context.observations.flatMap(observation => observation.result.data?.passages ?? [])
    .filter(passage => citationIds.has(passage.id) || passage.sentenceIds.some(id => citationIds.has(id))) ?? [];

  const inspector = <>
    <h2>Inspector</h2>
    {activeRun && <div className="agent-inspector-content">
      {event && <><h3>{event.title}</h3><p>{event.detail}</p></>}
      {event?.call && <details open><summary>Call {event.call.id}</summary><Json value={event.call} /></details>}
      {event?.result && <details open><summary>Result for {event.result.toolUseId}</summary><Json value={event.result} />
        {event.result.data?.passages?.map(passage => <blockquote key={passage.id}>
          <strong>{passage.source} · {passage.sentenceIds.join(", ")}</strong><p>{passage.text}</p>
        </blockquote>)}
      </details>}
      {event && <>
        <details><summary>Visible context · {event.snapshot.context.observations.length} observations</summary><Json value={event.snapshot.context} /></details>
        {(lesson.id === "memory" || lesson.id === "context") && <details><summary>Simulated memory</summary><Json value={event.snapshot.world.memory} /></details>}
        <details open={lesson.id === "idempotency" || builder}><summary>Draft records · {event.snapshot.world.drafts.length}</summary><Json value={event.snapshot.world.drafts} /></details>
        <details><summary>Run counts</summary><Json value={event.snapshot.metrics} /></details>
      </>}
      {completion && <section className="agent-outcome">
        <h3>{statusLabels[completion.status]}</h3><p>{completion.message}</p>
        {completion.claims.map(claim => <p key={claim.text}>{claim.text}
          {claim.evidenceIds.length > 0 && <small>Sources: {claim.evidenceIds.join(", ")}</small>}
        </p>)}
        {citedPassages.length > 0 && <details><summary>Read cited passages</summary>
          {[...new Map(citedPassages.map(passage => [passage.id, passage])).values()].map(passage =>
            <blockquote key={passage.id}><strong>{passage.source}</strong><p>{passage.text}</p></blockquote>)}
        </details>}
        <details open><summary>Outcome checks</summary><ul>{completion.evaluation.map(check =>
          <li key={check.id}><strong>{check.passed ? "Pass" : "Check"} · {check.label}</strong><p>{check.detail}</p></li>
        )}</ul></details>
      </section>}
      {chosenTool && <details open={!event}><summary>{chosenTool.name}</summary><p>{chosenTool.description}</p>
        <Json value={{ name: chosenTool.id, description: chosenTool.description, input_schema: chosenTool.inputSchema }} />
      </details>}
      {!event && !chosenTool && <p>Run an example, then use the playback controls to inspect each step.</p>}
    </div>}
    <LessonNote lesson={lesson} />
  </>;

  return <div className="course-workspace agent-workspace" data-panel={visiblePanel}>
    <div className="agent-mobile-panels" aria-label="Workspace panels">
      {(["canvas", "inspector", "history"] as const).filter(item => activeRun || item !== "history").map(item =>
        <button key={item} type="button" aria-pressed={visiblePanel === item} onClick={() => setPanel(item)}>
          {{ canvas: activeRun ? "Canvas" : "Lesson", inspector: "Inspector", history: "Run history" }[item]}
        </button>
      )}
    </div>
    <section className="course-lesson-stage agent-main">
      {!activeRun ? story : <>
        <div className="agent-toolbar">
          <span>Authored simulation</span>
          <Button variant="ghost" size="sm" onClick={() => onViewChange(trying ? "check" : "try")}>{trying ? "Check your understanding" : "Try an experiment"} <ArrowRight size={15} /></Button>
          {!fixed && <Button size="sm" disabled={pending} onClick={() => void start()}>{pending ? "Preparing run…" : run ? "Restart run" : "Run example"}</Button>}
        </div>
        {failure && <p role="alert">{failure}</p>}
        {run && <p className="agent-start-note">{run.events[0]?.snapshot.context.task.text}</p>}
        {comparison && <div className="agent-mode" aria-label="Compare approaches">
          {(["chatbot", "workflow", "agent"] as const).map(item =>
            <button key={item} type="button" aria-pressed={approach === item} onClick={() => {
              setApproach(item);
              player.pause();
            }}>{{ chatbot: "Chatbot", workflow: "Fixed workflow", agent: "Agent" }[item]}</button>
          )}
        </div>}
        {fixed ? <article className="course-understand agent-comparison">
          <h2>{approach === "chatbot" ? "Text response" : "Predefined path"}</h2>
          <p>Customer: “Can I return my headset?”</p>
          <ol>{(approach === "chatbot" ? ["Read the question", "Explain the general policy", "Ask for the order number"]
            : ["Ask for an order number", "Run order lookup", "Run the policy search if lookup succeeds", "Apply the return rules"]).map(step => <li key={step}>{step}</li>)}</ol>
          <p>{approach === "chatbot" ? "This example has no order tool." : "The application defines these steps in advance."}</p>
        </article> : <>
          {trying && <div className="agent-settings-box">
            <p>{lesson.tryInstructions[0]}</p>
            <fieldset className="agent-settings" disabled={pending}>
              <legend className="sr-only">Run configuration</legend>
              {availableScenarios.length > 1 && <Select label="Sample scenario" value={config.scenarioId} options={availableScenarios.map(item => [item.id, item.label])}
                change={id => {
                  const scenario = getScenarioConfig(id);
                  const taskPreset = builder ? config.taskPreset : lesson.id === "retrieval" ? "policy" : scenario.taskPreset;
                  setConfig(builder ? { ...config, ...scenario, taskPreset, enabledTools: config.enabledTools, contextMode: config.contextMode, maxToolAttempts: config.maxToolAttempts, maxRetries: config.maxRetries } : { ...scenario, taskPreset });
                  setFailure("");
                }} />}
              {builder && <Select label="Task" value={config.taskPreset} options={taskOptions} change={taskPreset => change({ taskPreset })} />}
              {trying && config.taskPreset === "policy" && <Select label="Policy topic" value={config.policyTopic}
                options={POLICY_TOPICS.map(topic => [topic, topic])} change={policyTopic => change({ policyTopic })} />}
              {builder && config.taskPreset === "stock" && <Select label="Product" value={config.sku}
                options={[["X200", "X200 headset"], ["P100", "P100 pouch"]]} change={sku => change({ sku })} />}
              {optionMode && <Select label="Visible context" value={config.contextMode}
                options={[["conversation", "Past observations included"], ["current-turn", "Current turn only"]]}
                change={contextMode => change({ contextMode })} />}
              {lesson.id === "memory" && <Select label="Simulated memory" value={config.memoryMode}
                options={[["off", "Off"], ["saved", "Save only"], ["retrieved", "Save, then read"]]} change={memoryMode => change({ memoryMode })} />}
              {optionLimits && <><Select label="Attempt limit" value={config.maxToolAttempts} options={[[3, "3"], [6, "6"], [10, "10"]]}
                change={maxToolAttempts => change({ maxToolAttempts })} />
                <Select label="Retry limit" value={config.maxRetries} options={[[0, "0"], [1, "1"], [2, "2"]]} change={maxRetries => change({ maxRetries })} />
                <Select label="Inject a failure" value={config.fault} options={faultOptions} change={fault => change({ fault })} /></>}
              {lesson.id === "idempotency" && <label className="agent-checkbox"><input type="checkbox" checked={config.reuseOperationKey}
                onChange={input => change({ reuseOperationKey: input.target.checked })} />Reuse the operation key on retry</label>}
            </fieldset>
          </div>}
          {trying && lesson.id === "contract" && <ToolSandbox />}
          {builder && trying && <div className="agent-mode" aria-label="Builder view">
            <button type="button" aria-pressed={builderPane === "connections"} onClick={() => setBuilderPane("connections")}>Connections</button>
            <button type="button" aria-pressed={builderPane === "execution"} onClick={() => setBuilderPane("execution")}>Execution</button>
          </div>}
          {builder && trying && <div className="agent-connections" hidden={builderPane !== "connections"}><ToolCanvas enabled={config.enabledTools} locked={pending} toggle={toggle} select={id => {
            setToolId(id);
            setPanel("inspector");
          }} event={event} /></div>}
          {(!builder || !trying || builderPane === "execution") && <AgentFlow event={event} events={events} playing={player.status === "running"} seek={index => {
            setToolId(undefined);
            player.seek(index);
          }} />}
          {run ? <div className="agent-playback">
            <p aria-live="polite">{event ? event.title + " · " + event.detail : "Run ready. Start playback or step forward."}</p>
            <VisualizerControls status={player.status} onPlay={player.play} onPause={player.pause} onReset={player.reset}
              onStepForward={player.stepForward} onStepBack={player.stepBack} delayMs={player.delayMs}
              onDelayChange={player.setDelayMs} stepIndex={player.index} stepCount={player.stepCount}>
              <button type="button" className="agent-history-trigger" onClick={() => setPanel(panel === "history" ? "canvas" : "history")}>Run history</button>
            </VisualizerControls>
          </div> : <p className="agent-start-note">{lesson.watchNarrationStages[0]}</p>}
        </>}
      </>}
    </section>
    <aside className="course-inspector agent-inspector" aria-label="Lesson inspector">{inspector}</aside>
    {visiblePanel === "history" && <aside className="agent-history" aria-label="Run history">
      <div className="agent-toolbar"><h2>Run history</h2><button type="button" onClick={() => setPanel("canvas")}>Back to lesson</button></div>
      {player.index < 0 ? <p>Play or step through a run to see its history.</p> : <ol>{events.slice(0, player.index + 1).map((item, index) =>
        <li key={item.id}><button type="button" aria-current={index === player.index ? "step" : undefined} onClick={() => {
          player.seek(index);
          setToolId(undefined);
          setPanel("canvas");
        }}>{item.title}</button></li>
      )}</ol>}
    </aside>}
  </div>;
}
