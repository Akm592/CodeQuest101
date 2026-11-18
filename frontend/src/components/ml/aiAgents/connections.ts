import { TOOL_IDS, type ToolId } from "../../../lib/aiAgents/types";

export function canConnectAgentTool(source: string | null, target: string | null, enabled: readonly ToolId[]): target is ToolId {
  return source === "agent" && TOOL_IDS.some(id => target === id && !enabled.includes(id));
}
