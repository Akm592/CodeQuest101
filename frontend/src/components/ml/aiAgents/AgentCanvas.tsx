import { useState } from "react";
import { Background, Controls, Handle, MarkerType, Position, ReactFlow, applyNodeChanges, type Edge, type Node, type NodeProps, type XYPosition } from "@xyflow/react";
import { AGENT_TOOLS } from "../../../lib/aiAgents/data";
import type { AgentEvent, ToolId } from "../../../lib/aiAgents/types";
import { canConnectAgentTool } from "./connections";
import "@xyflow/react/dist/style.css";

type CardNode = Node<{ label: string; detail: string; active: boolean; select?: () => void; source: boolean; target: boolean }, "card">;

function Card({ data }: NodeProps<CardNode>) {
  return <div className={data.active ? "agent-node agent-node-active" : "agent-node"}>
    {data.target && <Handle type="target" position={Position.Left} />}
    {data.select ? <button className="nodrag nopan" type="button" onClick={data.select}>{data.label}</button> : <strong>{data.label}</strong>}
    <span>{data.detail}</span>
    {data.source && <Handle type="source" position={Position.Right} />}
  </div>;
}
const nodeTypes = { card: Card };

function node(id: string, x: number, y: number, data: CardNode["data"]): CardNode {
  return {
    id, type: "card", position: { x, y }, width: 168, height: 76, initialWidth: 168, initialHeight: 76,
    handles: [
      ...(data.target ? [{ type: "target" as const, position: Position.Left, x: 0, y: 38 }] : []),
      ...(data.source ? [{ type: "source" as const, position: Position.Right, x: 168, y: 38 }] : []),
    ],
    data,
  };
}

function edge(source: string, target: string, active: boolean, playing: boolean): Edge {
  const color = active ? "#5eead4" : "#64748b";
  return {
    id: source + "-" + target, source, target, type: "smoothstep", animated: active && playing,
    style: { stroke: color, strokeWidth: active ? 2.5 : 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color },
  };
}

function stage(event?: AgentEvent) {
  switch (event?.kind) {
    case "decision": case "retry": return "decision";
    case "tool_request": case "validation": return "runtime";
    case "tool_execution": return "tool";
    case "tool_result": case "observation": return "observation";
    case "completion": return "completion";
    default: return "task";
  }
}

export function AgentFlow({ event, events, seek, playing }: { event?: AgentEvent; events: readonly AgentEvent[]; seek: (index: number) => void; playing: boolean }) {
  const active = stage(event);
  const current = event ? events.indexOf(event) : -1;
  const cards = [
    ["task", "Customer task", "Question and visible context", 0, 0],
    ["decision", "Agent decision", "Authored simulation", 212, 0],
    ["runtime", "Application", "Validate tool and arguments", 424, 0],
    ["tool", "Tool execution", event?.toolId ?? "Run against sample data", 636, 0],
    ["observation", "Observation", "Matched result or error", 424, 150],
    ["completion", "Answer", "Report the outcome", 424, -150],
  ] as const;
  const nodes = cards.map(([id, label, detail, x, y]) => {
    const index = events.slice(0, current + 1).map(stage).lastIndexOf(id);
    return node(id, x, y, { label, detail, active: id === active, source: id !== "completion", target: id !== "task",
      select: index >= 0 ? () => seek(index) : undefined });
  });
  const lastStage = stage(events.slice(0, current).reverse().find(step => stage(step) !== active));
  const edges = [
    ["task", "decision"], ["decision", "runtime"], ["runtime", "tool"],
    ["tool", "observation"], ["runtime", "observation"], ["observation", "decision"],
    ["decision", "completion"], ["observation", "completion"], ["runtime", "completion"],
  ].map(([from, to]) => edge(from, to, from === lastStage && to === active, playing));
  return <div className="course-diagram agent-canvas" aria-label="Agent execution diagram">
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} width={805} height={420} fitView
      minZoom={0.25} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} zoomOnScroll={false}
      deleteKeyCode={null} colorMode="dark" proOptions={{ hideAttribution: true }}>
      <Background /><Controls showInteractive={false} />
    </ReactFlow>
  </div>;
}

export function ToolCanvas({ enabled, locked, toggle, select, event }: {
  enabled: ToolId[]; locked: boolean; toggle: (id: ToolId) => void; select: (id: ToolId) => void; event?: AgentEvent;
}) {
  const [positions, setPositions] = useState<Partial<Record<string, XYPosition>>>({});
  const canConnect = ({ source, target }: { source: string | null; target: string | null }) =>
    !locked && canConnectAgentTool(source, target, enabled);
  const nodes = [
    { ...node("agent", 0, 155, { label: "One agent", detail: "Available capabilities", source: true, target: false, active: event?.kind === "decision" }), draggable: false },
    ...AGENT_TOOLS.map((tool, index) => node(tool.id, 360, index * 108, {
      label: tool.name, detail: enabled.includes(tool.id) ? "Connected" : "Available to connect",
      target: true, source: false, active: event?.toolId === tool.id, select: () => select(tool.id),
    })),
  ].map(card => ({ ...card, position: positions[card.id] ?? card.position }));
  const edges = enabled.map(id => edge("agent", id, event?.toolId === id, false));
  return <>
    <div className="course-diagram agent-canvas" aria-label="Connect tools to the agent">
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} width={600} height={420} fitView minZoom={0.3}
        colorMode="dark" proOptions={{ hideAttribution: true }} deleteKeyCode={null} zoomOnScroll={false}
        isValidConnection={canConnect} nodesConnectable={!locked}
        onConnect={connection => {
          if (!locked && canConnectAgentTool(connection.source, connection.target, enabled)) toggle(connection.target);
        }}
        onNodesChange={changes => {
          if (!changes.some(change => change.type === "position")) return;
          const moved = applyNodeChanges(changes, nodes);
          setPositions(Object.fromEntries(moved.map(card => [card.id, card.position])));
        }}>
        <Background /><Controls showInteractive={false} />
      </ReactFlow>
    </div>
    <div className="agent-tools" aria-label="Tool connections">
      {AGENT_TOOLS.map(tool => <button key={tool.id} type="button" disabled={locked} aria-pressed={enabled.includes(tool.id)}
        onClick={() => toggle(tool.id)}>{enabled.includes(tool.id) ? "Disconnect" : "Connect"} {tool.name}</button>)}
    </div>
  </>;
}
