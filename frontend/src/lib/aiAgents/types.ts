export const TOOL_IDS = ["lookup_order", "get_stock", "search_policies", "create_return_draft"] as const;
export type ToolId = (typeof TOOL_IDS)[number];
export type TaskPreset = "eligibility" | "return-draft" | "stock" | "policy";
export type PolicyTopic = "returns" | "refunds" | "warranty" | "shipping" | "supplier" | "discount";
export type ScenarioId = "eligible-return" | "used-item" | "expired-return" | "stock-check" | "missing-order" | "unknown-order" | "missing-policy" | "tool-timeout" | "invalid-arguments" | "lost-response" | "follow-up" | "memory-preference";
export type AgentStatus = "completed" | "needs_input" | "blocked" | "failed" | "limit_reached";
export type Fault = "none" | "timeout-once" | "always-timeout" | "invalid-arguments" | "lost-response";

export interface AgentConfig {
  scenarioId: ScenarioId;
  taskPreset: TaskPreset;
  orderId: string;
  sku: string;
  policyTopic: PolicyTopic;
  enabledTools: ToolId[];
  contextMode: "conversation" | "current-turn";
  maxToolAttempts: 3 | 6 | 10;
  maxRetries: 0 | 1 | 2;
  fault: Fault;
  reuseOperationKey: boolean;
  memoryMode: "off" | "saved" | "retrieved";
  argumentOverride?: { toolId: ToolId; input: unknown };
}
export interface ToolDefinition {
  id: ToolId;
  name: string;
  description: string;
  inputSchema: { type: "object"; properties: Record<string, { type: "string"; description: string; enum?: string[] }>; required: string[]; additionalProperties: false };
  exampleInput: Record<string, string>;
  effect: "read" | "local-draft";
}
export interface SampleOrder { id: string; sku: string; daysSinceDelivery: number; used: boolean; opened: boolean }
export interface StockItem { sku: string; name: string; available: number }
export interface ReturnDraft { id: string; orderId: string; reason: string; operationKey: string; status: "draft" }
export interface AgentWorld {
  orders: SampleOrder[];
  stock: StockItem[];
  drafts: ReturnDraft[];
  memory: Record<string, string>;
}
export interface SourcePassage { id: string; source: string; text: string; sentenceIds: string[] }
export interface ToolData {
  order?: SampleOrder;
  stock?: StockItem;
  topic?: PolicyTopic;
  passages?: SourcePassage[];
  draft?: ReturnDraft;
  idempotentReplay?: boolean;
}
export interface ToolCall { id: string; name: string; input: unknown; operationKey?: string }
export interface ToolError { code: "INVALID_ARGUMENTS" | "TOOL_UNAVAILABLE" | "NOT_FOUND" | "TIMEOUT" | "NOT_ELIGIBLE" | "KEY_CONFLICT" | "RETRIEVAL_FAILED"; message: string; retryable: boolean }
export interface ToolResult { toolUseId: string; toolId: string; ok: boolean; data?: ToolData; error?: ToolError }
export interface Observation { call: ToolCall; result: ToolResult }
export interface AgentTask { preset: TaskPreset; text: string; orderId: string; sku: string; policyTopic: PolicyTopic }
export interface AgentContext { task: AgentTask; observations: Observation[]; memory: Record<string, string> }
export interface AgentClaim {
  text: string;
  evidenceIds: string[];
  toolCallIds: string[];
  eligibility?: { orderId: string; eligible: boolean; daysSinceDelivery: number; used: boolean };
  stock?: StockItem;
  draftId?: string;
}
export interface AgentMetrics { attempts: number; executions: number; retries: number; validationErrors: number; toolErrors: number; draftsCreated: number }
export interface AgentSnapshot { context: AgentContext; world: AgentWorld; metrics: AgentMetrics }
export type AgentEventKind = "context" | "memory_write" | "new_conversation" | "memory_read" | "decision" | "tool_request" | "validation" | "tool_execution" | "tool_result" | "observation" | "retry" | "completion";
export interface AgentEvent {
  id: string;
  kind: AgentEventKind;
  title: string;
  detail: string;
  toolId?: string;
  call?: ToolCall;
  result?: ToolResult;
  snapshot: AgentSnapshot;
}
export interface EvaluationCheck { id: string; label: string; passed: boolean; detail: string }
export interface AgentRun {
  config: AgentConfig;
  events: AgentEvent[];
  status: AgentStatus;
  message: string;
  claims: AgentClaim[];
  world: AgentWorld;
  metrics: AgentMetrics;
  evaluation: EvaluationCheck[];
}
export interface AgentScenario { id: ScenarioId; label: string; description: string; taskPreset: TaskPreset; orderId?: string; sku?: string; policyTopic?: PolicyTopic; fault?: Fault }
