import type { AgentConfig, AgentScenario, AgentWorld, PolicyTopic, ScenarioId, ToolDefinition } from "./types";

export const POLICY_TOPICS: PolicyTopic[] = ["returns", "refunds", "warranty", "shipping", "supplier", "discount"];
export const AGENT_TOOLS: ToolDefinition[] = [
  { id: "lookup_order", name: "Look up an order", description: "Read delivery age, product, and item condition from the sample order store. Requires an order number.", effect: "read", inputSchema: { type: "object", properties: { orderId: { type: "string", description: "The customer's order number, for example L-1001." } }, required: ["orderId"], additionalProperties: false }, exampleInput: { orderId: "L-1001" } },
  { id: "get_stock", name: "Check stock", description: "Read the available quantity of one product from sample inventory. Requires a product SKU.", effect: "read", inputSchema: { type: "object", properties: { sku: { type: "string", description: "The product identifier, for example X200." } }, required: ["sku"], additionalProperties: false }, exampleInput: { sku: "X200" } },
  { id: "search_policies", name: "Search policy evidence", description: "Retrieve source passages for one supported Luma Shop policy topic. Search text uses prepared examples; results are actual retrieval, not generated answers.", effect: "read", inputSchema: { type: "object", properties: { topic: { type: "string", description: "One supported policy topic.", enum: POLICY_TOPICS } }, required: ["topic"], additionalProperties: false }, exampleInput: { topic: "returns" } },
  { id: "create_return_draft", name: "Create a return draft", description: "Create a local simulated draft for an unused item delivered at most 30 days ago. The application supplies the retry operation key. This never submits a return or issues a refund.", effect: "local-draft", inputSchema: { type: "object", properties: { orderId: { type: "string", description: "The eligible sample order number." }, reason: { type: "string", description: "A short reason for the draft." } }, required: ["orderId", "reason"], additionalProperties: false }, exampleInput: { orderId: "L-1001", reason: "Opened packaging; item unused." } },
];

export const AGENT_SCENARIOS: AgentScenario[] = [
  { id: "eligible-return", label: "Unused item · 14 days", description: "Opened packaging is allowed; the unused item is within the return window.", taskPreset: "return-draft", orderId: "L-1001" },
  { id: "used-item", label: "Used item", description: "The order is recent, but the item has been used.", taskPreset: "return-draft", orderId: "L-1002" },
  { id: "expired-return", label: "Unused item · 45 days", description: "The item is unused, but the return window has passed.", taskPreset: "return-draft", orderId: "L-1003" },
  { id: "stock-check", label: "Check X200 stock", description: "The stock task needs inventory, not a policy search or a return draft.", taskPreset: "stock", sku: "X200" },
  { id: "missing-order", label: "Order number missing", description: "Ask the user for the missing order number before looking anything up.", taskPreset: "eligibility", orderId: "" },
  { id: "unknown-order", label: "Order not found", description: "A correctly shaped request can still name an order absent from the store.", taskPreset: "eligibility", orderId: "L-9999" },
  { id: "missing-policy", label: "Student discount · no evidence", description: "The supplied documents do not state a student discount policy.", taskPreset: "policy", policyTopic: "discount" },
  { id: "tool-timeout", label: "One temporary failure", description: "The first read times out; a bounded retry can recover.", taskPreset: "return-draft", fault: "timeout-once" },
  { id: "invalid-arguments", label: "Invalid first arguments", description: "The first authored request uses the wrong value type. Validate it before execution.", taskPreset: "eligibility", fault: "invalid-arguments" },
  { id: "lost-response", label: "Draft committed · response lost", description: "The first draft is stored before its response times out. Retry with the same operation key.", taskPreset: "return-draft", fault: "lost-response" },
  { id: "follow-up", label: "Follow-up: can I return it?", description: "The previous conversation looked up L-1001. Include or omit that observation from the new context.", taskPreset: "eligibility", orderId: "" },
  { id: "memory-preference", label: "Remember my preferred product", description: "Save X200 as a preference, start a new conversation, then explicitly load it before checking stock.", taskPreset: "stock", sku: "" },
];

export const AGENT_DEFAULT: AgentConfig = {
  scenarioId: "eligible-return", taskPreset: "return-draft", orderId: "L-1001", sku: "X200", policyTopic: "returns",
  enabledTools: ["lookup_order", "search_policies", "create_return_draft"], contextMode: "conversation", maxToolAttempts: 6,
  maxRetries: 1, fault: "none", reuseOperationKey: true, memoryMode: "retrieved",
};

export function getScenarioConfig(id: ScenarioId, changes: Partial<AgentConfig> = {}): AgentConfig {
  const scenario = AGENT_SCENARIOS.find((item) => item.id === id);
  if (!scenario) throw new RangeError("Choose a supported authored scenario.");
  return { ...AGENT_DEFAULT, scenarioId: id, taskPreset: scenario.taskPreset, orderId: scenario.orderId ?? "L-1001", sku: scenario.sku ?? "X200", policyTopic: scenario.policyTopic ?? "returns", fault: scenario.fault ?? "none",
    enabledTools: scenario.taskPreset === "stock" ? ["get_stock"] : [...AGENT_DEFAULT.enabledTools], ...changes };
}

export function createAgentWorld(): AgentWorld {
  return {
    orders: [
      { id: "L-1001", sku: "X200", daysSinceDelivery: 14, used: false, opened: true },
      { id: "L-1002", sku: "X200", daysSinceDelivery: 14, used: true, opened: true },
      { id: "L-1003", sku: "X200", daysSinceDelivery: 45, used: false, opened: false },
    ],
    stock: [{ sku: "X200", name: "Luma wireless headset", available: 12 }, { sku: "P100", name: "Headset pouch", available: 0 }],
    drafts: [], memory: {},
  };
}
