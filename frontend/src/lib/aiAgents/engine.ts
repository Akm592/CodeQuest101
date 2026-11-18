import { AGENT_DEFAULT, AGENT_SCENARIOS, AGENT_TOOLS, createAgentWorld, getScenarioConfig, POLICY_TOPICS } from "./data";
import { TOOL_IDS, type AgentClaim, type AgentConfig, type AgentContext, type AgentEvent, type AgentEventKind, type AgentMetrics, type AgentRun, type AgentStatus, type AgentTask, type AgentWorld, type EvaluationCheck, type Observation, type PolicyTopic, type ToolCall, type ToolError, type ToolId, type ToolResult } from "./types";

export { AGENT_DEFAULT, AGENT_SCENARIOS, AGENT_TOOLS, createAgentWorld, getScenarioConfig, POLICY_TOPICS } from "./data";
export type * from "./types";

const clone = <T>(value: T): T => structuredClone(value);
function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
  return value;
}
const failure = (call: ToolCall, code: ToolError["code"], message: string, retryable = false): ToolResult => ({ toolUseId: call.id, toolId: call.name, ok: false, error: { code, message, retryable } });
const successful = (call: ToolCall, data: NonNullable<ToolResult["data"]>): ToolResult => ({ toolUseId: call.id, toolId: call.name, ok: true, data });

export function validateToolInput(toolId: string, input: unknown): { valid: boolean; error?: ToolError } {
  const definition = AGENT_TOOLS.find((tool) => tool.id === toolId);
  if (!definition) return { valid: false, error: { code: "TOOL_UNAVAILABLE", message: "The requested tool is not in the built-in tool registry.", retryable: false } };
  const invalid = (message: string) => ({ valid: false, error: { code: "INVALID_ARGUMENTS" as const, message, retryable: false } });
  if (!input || typeof input !== "object" || Array.isArray(input)) return invalid("Arguments must be an object.");
  const record = input as Record<string, unknown>;
  if (Object.keys(record).some((key) => !Object.prototype.hasOwnProperty.call(definition.inputSchema.properties, key))) return invalid("Unexpected argument. This fixed tool accepts only its documented fields.");
  for (const key of definition.inputSchema.required) {
    if (!Object.prototype.hasOwnProperty.call(record, key) || typeof record[key] !== "string" || !(record[key] as string).trim() || (record[key] as string).length > 240) return invalid(`${key} must be a nonempty string of at most 240 characters.`);
    const allowed = definition.inputSchema.properties[key].enum;
    if (allowed && !allowed.includes(record[key] as string)) return invalid(`${key} must be one of: ${allowed.join(", ")}.`);
  }
  return { valid: true };
}

export function validateToolRequest(call: ToolCall, enabledTools: readonly ToolId[]): { valid: boolean; error?: ToolError } {
  if (!enabledTools.some((id) => id === call.name)) return { valid: false, error: { code: "TOOL_UNAVAILABLE", message: "The application refuses this disconnected tool, regardless of the authored decision.", retryable: false } };
  return validateToolInput(call.name, call.input);
}

async function executeTool(call: ToolCall, world: AgentWorld, enabledTools: readonly ToolId[] = TOOL_IDS): Promise<ToolResult> {
  const validation = validateToolRequest(call, enabledTools);
  if (!validation.valid) return failure(call, validation.error!.code, validation.error!.message);
  const input = call.input as Record<string, string>;
  if (call.name === "lookup_order") {
    const order = world.orders.find((item) => item.id === input.orderId);
    return order ? successful(call, { order: clone(order) }) : failure(call, "NOT_FOUND", "No sample order has that number. Check the order number with the user.");
  }
  if (call.name === "get_stock") {
    const stock = world.stock.find((item) => item.sku === input.sku);
    return stock ? successful(call, { stock: clone(stock) }) : failure(call, "NOT_FOUND", "This product is not in the sample inventory.");
  }
  if (call.name === "search_policies") {
    try {
      const { searchPolicyEvidence } = await import("./ragAdapter");
      const topic = input.topic as PolicyTopic;
      return successful(call, { topic, passages: await searchPolicyEvidence(topic) });
    } catch {
      return failure(call, "RETRIEVAL_FAILED", "The recorded policy index could not be loaded. Retry the experiment.");
    }
  }
  const key = call.operationKey;
  if (!key || key.length > 240) return failure(call, "INVALID_ARGUMENTS", "The application must supply a valid operation key for draft creation.");
  const previous = world.drafts.find((draft) => draft.operationKey === key);
  if (previous) {
    return previous.orderId === input.orderId && previous.reason === input.reason
      ? successful(call, { draft: clone(previous), idempotentReplay: true })
      : failure(call, "KEY_CONFLICT", "This operation key already represents different arguments.");
  }
  const order = world.orders.find((item) => item.id === input.orderId);
  if (!order) return failure(call, "NOT_FOUND", "The order does not exist.");
  if (order.used || order.daysSinceDelivery > 30) return failure(call, "NOT_ELIGIBLE", "Only unused items delivered at most 30 days ago qualify for this sample return rule.");
  const draft = { id: `draft-${world.drafts.length + 1}`, orderId: order.id, reason: input.reason, operationKey: key, status: "draft" as const };
  world.drafts.push(draft);
  return successful(call, { draft: clone(draft), idempotentReplay: false });
}

/** A separate experiment: this clones its sample store and never advances or mutates a recorded run. */
export async function runToolSandbox(toolId: string, input: unknown, initialWorld = createAgentWorld(), operationKey = "sandbox-operation", enabledTools: readonly ToolId[] = TOOL_IDS): Promise<{ call: ToolCall; result: ToolResult; world: AgentWorld }> {
  const world = clone(initialWorld);
  const call: ToolCall = { id: "sandbox-call", name: toolId, input: clone(input), ...(toolId === "create_return_draft" ? { operationKey } : {}) };
  return freeze({ call, result: await executeTool(call, world, enabledTools), world });
}

const factDefinitions: Record<PolicyTopic, { text: string; evidenceIds: string[] }[]> = {
  returns: [
    { text: "Unused purchases can be returned within 30 days of delivery.", evidenceIds: ["D1-s1"] },
    { text: "Opened packaging is allowed when the item has not been used.", evidenceIds: ["D1-s2"] },
    { text: "X200 follows the standard return policy.", evidenceIds: ["D2-s1"] },
  ],
  refunds: [{ text: "Refunds start after the warehouse receives and checks the item; the money reaches the original payment method within five business days after that check.", evidenceIds: ["D3-s1", "D3-s2"] }],
  warranty: [{ text: "Manufacturing defects are covered for one year; accidental damage and ordinary wear are not covered.", evidenceIds: ["D5-s1", "D5-s2"] }],
  shipping: [{ text: "Standard delivery takes three to five business days after dispatch.", evidenceIds: ["D4-s1"] }, { text: "Orders above 50 dollars receive free standard delivery.", evidenceIds: ["D4-s3"] }],
  supplier: [{ text: "NovaCells supplies the X200 battery.", evidenceIds: ["D2-s3"] }],
  discount: [],
};

function recentObservation(context: AgentContext, toolId: ToolId, matches: (item: Observation) => boolean = () => true): Observation | undefined {
  return [...context.observations].reverse().find((item) => item.call.name === toolId && item.result.ok && matches(item));
}
function sourceFacts(topic: PolicyTopic, observation: Observation): AgentClaim[] {
  const present = new Set(observation.result.data?.passages?.flatMap((passage) => passage.sentenceIds));
  // shortcut: authored facts interpret this fixed teaching corpus; open-ended sources require a real extraction/model stage.
  return factDefinitions[topic].filter((fact) => fact.evidenceIds.every((id) => present.has(id))).map((fact) => ({ ...fact, evidenceIds: [...fact.evidenceIds], toolCallIds: [observation.call.id] }));
}

function eligibilityText(order: { id: string; used: boolean; daysSinceDelivery: number }): string {
  const explanation = order.used ? "The item has been used, so it does not meet the unused-item condition." : order.daysSinceDelivery > 30 ? "The order is outside the 30-day return window." : "The item is unused and within 30 days; opened packaging is allowed.";
  return `${order.id}: ${explanation}`;
}

type AgentDecision = { kind: "call"; toolId: ToolId; input: Record<string, string>; explanation: string }
  | { kind: "finish"; status: AgentStatus; message: string; claims: AgentClaim[]; explanation: string };

/** Authored teaching policy. It cannot inspect the tool store or evaluation expectations. */
export function decideAgentAction(context: AgentContext, enabledTools: readonly ToolId[]): AgentDecision {
  const finish = (status: AgentStatus, message: string, claims: AgentClaim[] = []): AgentDecision => ({ kind: "finish", status, message, claims, explanation: message });
  const call = (toolId: ToolId, input: Record<string, string>, explanation: string): AgentDecision => enabledTools.includes(toolId)
    ? { kind: "call", toolId, input, explanation }
    : finish("blocked", `The task needs ${toolId}, but that tool is disconnected. Connect it or choose a task the available tools can complete.`);
  const task = context.task;
  if (task.preset === "stock") {
    const sku = task.sku || context.memory.preferredSku;
    if (!sku) return finish("needs_input", "Which product should I check? A saved preference must be explicitly loaded into this context before I can use it.");
    const observation = recentObservation(context, "get_stock", (item) => item.result.data?.stock?.sku === sku);
    if (!observation) return call("get_stock", { sku }, "The task asks for inventory. A policy search cannot tell me the current sample stock count.");
    const stock = observation.result.data!.stock!;
    return finish("completed", `${stock.sku}: ${stock.available} available in the sample inventory.`, [{ text: `${stock.sku}: ${stock.available} available.`, evidenceIds: [], toolCallIds: [observation.call.id], stock: clone(stock) }]);
  }
  if (task.preset === "policy") {
    const observation = recentObservation(context, "search_policies", (item) => item.result.data?.topic === task.policyTopic);
    if (!observation) return call("search_policies", { topic: task.policyTopic }, "A policy answer needs document evidence. I will search the supported topic rather than invent a policy.");
    const facts = sourceFacts(task.policyTopic, observation);
    return facts.length ? finish("completed", facts.map((fact) => fact.text).join(" "), facts)
      : finish("blocked", "The retrieved passages do not establish this policy. I cannot answer it from the supplied evidence.");
  }
  const priorOrder = recentObservation(context, "lookup_order")?.result.data?.order;
  const orderId = task.orderId || priorOrder?.id;
  if (!orderId) return finish("needs_input", "What is your order number? I need it before checking eligibility.");
  const orderObservation = recentObservation(context, "lookup_order", (item) => item.result.data?.order?.id === orderId);
  if (!orderObservation) return call("lookup_order", { orderId }, "I need the order's actual delivery age and item condition before applying a return rule.");
  const policyObservation = recentObservation(context, "search_policies", (item) => item.result.data?.topic === "returns");
  if (!policyObservation) return call("search_policies", { topic: "returns" }, "The order gives facts about the item. I still need the current return conditions from a source.");
  const facts = sourceFacts("returns", policyObservation);
  const evidenceIds = [...new Set(facts.flatMap((fact) => fact.evidenceIds))];
  if (!["D1-s1", "D1-s2", "D2-s1"].every((id) => evidenceIds.includes(id))) return finish("blocked", "The retrieved context is missing a required return condition or the X200 policy link. I will not guess eligibility.");
  const order = orderObservation.result.data!.order!;
  const eligible = !order.used && order.daysSinceDelivery <= 30;
  const claim: AgentClaim = { text: eligibilityText(order), evidenceIds, toolCallIds: [orderObservation.call.id, policyObservation.call.id], eligibility: { orderId: order.id, eligible, daysSinceDelivery: order.daysSinceDelivery, used: order.used } };
  if (task.preset === "eligibility") return finish("completed", claim.text, [claim]);
  if (!eligible) return finish("blocked", `${claim.text} No return draft was created.`, [claim]);
  const draftObservation = recentObservation(context, "create_return_draft", (item) => item.result.data?.draft?.orderId === orderId);
  if (!draftObservation) return call("create_return_draft", { orderId, reason: "Opened packaging; item unused." }, "The observed order and returned policy support a local draft. The application will validate eligibility again.");
  const draft = draftObservation.result.data!.draft!;
  return finish("completed", `Created ${draft.id} for ${draft.orderId} in the sample store. This is a draft, not a submitted return or refund.`, [claim, { text: `Created local ${draft.id} for ${draft.orderId}.`, evidenceIds: [], toolCallIds: [draftObservation.call.id], draftId: draft.id }]);
}

function validateConfig(config: AgentConfig) {
  if (!AGENT_SCENARIOS.some((scenario) => scenario.id === config.scenarioId) || !["eligibility", "return-draft", "stock", "policy"].includes(config.taskPreset)
    || !Array.isArray(config.enabledTools) || config.enabledTools.some((id) => !TOOL_IDS.includes(id)) || new Set(config.enabledTools).size !== config.enabledTools.length
    || !["conversation", "current-turn"].includes(config.contextMode) || ![3, 6, 10].includes(config.maxToolAttempts) || ![0, 1, 2].includes(config.maxRetries)
    || !["none", "timeout-once", "always-timeout", "invalid-arguments", "lost-response"].includes(config.fault) || typeof config.reuseOperationKey !== "boolean"
    || !["off", "saved", "retrieved"].includes(config.memoryMode) || !POLICY_TOPICS.includes(config.policyTopic)
    || [config.orderId, config.sku].some((value) => typeof value !== "string" || value.length > 240)
    || config.argumentOverride && !TOOL_IDS.includes(config.argumentOverride.toolId)) throw new RangeError("Choose one of the supported agent configurations.");
}

export function evaluateAgentRun(run: Pick<AgentRun, "config" | "events" | "status" | "claims" | "world" | "metrics">): EvaluationCheck[] {
  const observations = run.events.filter((event) => event.kind === "observation" && event.result && event.call);
  const successfulCalls = new Map(observations.filter((event) => event.result!.ok).map((event) => [event.call!.id, event.result!]));
  const context = run.events.at(-1)?.snapshot.context;
  for (const observation of context?.observations ?? []) if (observation.result.ok && !successfulCalls.has(observation.call.id)) successfulCalls.set(observation.call.id, observation.result);
  const expectedOrderId = run.config.orderId || (run.config.scenarioId === "follow-up" && run.config.contextMode === "conversation" ? "L-1001" : "");
  const order = run.world.orders.find((item) => item.id === expectedOrderId);
  let objective = false;
  if (run.config.taskPreset === "stock") {
    const sku = run.config.sku || context?.memory.preferredSku;
    objective = !sku ? run.status === "needs_input" : run.status === "completed" && [...successfulCalls.values()].some((result) => result.data?.stock?.sku === sku);
  } else if (run.config.taskPreset === "policy") {
    objective = run.config.policyTopic === "discount" ? run.status === "blocked" && run.claims.length === 0 : run.status === "completed" && run.claims.length > 0;
  } else if (!expectedOrderId) objective = run.status === "needs_input";
  else if (!order) objective = run.status === "failed" && observations.some((event) => event.result!.error?.code === "NOT_FOUND");
  else if (run.config.taskPreset === "eligibility") objective = run.status === "completed" && run.claims.some((claim) => claim.eligibility?.orderId === order.id && claim.eligibility.eligible === (!order.used && order.daysSinceDelivery <= 30) && claim.eligibility.daysSinceDelivery === order.daysSinceDelivery && claim.eligibility.used === order.used && claim.toolCallIds.some((id) => successfulCalls.get(id)?.data?.order?.id === order.id));
  else if (order.used || order.daysSinceDelivery > 30) objective = run.status === "blocked" && run.world.drafts.length === 0;
  else objective = run.status === "completed" && run.world.drafts.some((draft) => draft.orderId === order.id);
  const effects = new Set(run.world.drafts.map((draft) => `${draft.orderId}\0${draft.reason}`));
  const evidence = run.claims.every((claim) => {
    const cited = claim.toolCallIds.map((id) => successfulCalls.get(id));
    const sources = new Set(cited.flatMap((result) => result?.data?.passages?.flatMap((passage) => passage.sentenceIds) ?? []));
    const draft = cited.find((result) => result?.data?.draft?.id === claim.draftId)?.data?.draft;
    // These are authored display templates, not an evaluator for arbitrary generated language.
    const textConsistent = claim.stock ? claim.text === `${claim.stock.sku}: ${claim.stock.available} available.`
      : claim.draftId ? !!draft && claim.text === `Created local ${draft.id} for ${draft.orderId}.`
      : claim.eligibility ? claim.text === eligibilityText({ id: claim.eligibility.orderId, ...claim.eligibility })
      : Object.values(factDefinitions).flat().some((fact) => fact.text === claim.text && fact.evidenceIds.length === claim.evidenceIds.length && fact.evidenceIds.every((id) => claim.evidenceIds.includes(id)));
    return textConsistent && cited.every(Boolean) && claim.evidenceIds.every((id) => sources.has(id))
      && (!claim.stock || cited.some((result) => result?.data?.stock?.sku === claim.stock!.sku && result.data.stock.available === claim.stock!.available))
      && (!claim.draftId || !!draft && run.world.drafts.some((item) => item.id === draft.id && item.orderId === draft.orderId))
      && (!claim.eligibility || ["D1-s1", "D1-s2", "D2-s1"].every((id) => claim.evidenceIds.includes(id)) && cited.some((result) => result?.data?.order?.id === claim.eligibility!.orderId && result.data.order.used === claim.eligibility!.used && result.data.order.daysSinceDelivery === claim.eligibility!.daysSinceDelivery) && claim.eligibility.eligible === (!claim.eligibility.used && claim.eligibility.daysSinceDelivery <= 30));
  });
  const inputs = observations.filter((event) => event.result!.ok).every((event) => validateToolInput(event.call!.name, event.call!.input).valid);
  return [
    { id: "outcome", label: "Task outcome", passed: objective, detail: objective ? "The observed state supports the task outcome or the correct request for missing information." : "The requested outcome was not established. Inspect the stop reason and actual tool results." },
    { id: "inputs", label: "Valid executed inputs", passed: inputs, detail: "Successful tool calls must satisfy the fixed tool contracts." },
    { id: "evidence", label: "Claims have observations", passed: evidence, detail: "Every cited source and successful call must actually be present in the observed run." },
    { id: "effects", label: "No duplicate draft effects", passed: effects.size === run.world.drafts.length, detail: `${run.world.drafts.length} stored draft(s) for ${effects.size} distinct order/reason intention(s).` },
    { id: "limits", label: "Attempt limit respected", passed: run.metrics.attempts <= run.config.maxToolAttempts, detail: `${run.metrics.attempts}/${run.config.maxToolAttempts} attempts, including rejected requests and retries.` },
  ];
}

export async function runAgentSimulation(changes: Partial<AgentConfig> = {}): Promise<AgentRun> {
  const config = clone(getScenarioConfig(changes.scenarioId ?? AGENT_DEFAULT.scenarioId, changes));
  validateConfig(config);
  const world = createAgentWorld();
  const task: AgentTask = { preset: config.taskPreset, orderId: config.orderId, sku: config.sku, policyTopic: config.policyTopic,
    text: config.taskPreset === "stock" ? `Check stock${config.sku ? ` for ${config.sku}` : " for my preferred product"}.` : config.taskPreset === "policy" ? `Explain the ${config.policyTopic} policy using sources.` : `${config.taskPreset === "eligibility" ? "Check return eligibility" : "Prepare a local return draft"}${config.orderId ? ` for ${config.orderId}` : " for my order"}.` };
  const context: AgentContext = { task, observations: [], memory: {} };
  const metrics: AgentMetrics = { attempts: 0, executions: 0, retries: 0, validationErrors: 0, toolErrors: 0, draftsCreated: 0 };
  const events: AgentEvent[] = [];
  const emit = (kind: AgentEventKind, title: string, detail: string, extra: Pick<AgentEvent, "toolId" | "call" | "result"> = {}) => {
    metrics.draftsCreated = world.drafts.length;
    events.push(freeze(clone({ id: `event-${events.length + 1}`, kind, title, detail, ...extra, snapshot: { context, world, metrics } })));
  };
  if (config.scenarioId === "follow-up" && config.contextMode === "conversation") {
    const call: ToolCall = { id: "prior-order", name: "lookup_order", input: { orderId: "L-1001" } };
    context.observations.push({ call, result: await executeTool(call, world) });
  }
  emit("context", "Build the visible context", config.scenarioId === "follow-up" ? config.contextMode === "conversation" ? "Include the previous conversation's actual order lookup. It is visible context, not a new tool attempt." : "Start with only the current turn. The earlier order lookup is not visible to the decision policy." : "The authored decision policy receives the task, connected tools, and visible observations; it cannot inspect the sample store.");
  if (config.scenarioId === "memory-preference") {
    if (config.memoryMode !== "off") { world.memory.preferredSku = "X200"; emit("memory_write", "Save a preference", "The application explicitly stores preferredSku = X200 in this simulated memory store."); }
    context.observations = []; context.memory = {};
    emit("new_conversation", "Start a new conversation", "Conversation context is cleared. A stored preference is not automatically visible to the agent.");
    if (config.memoryMode === "retrieved") { context.memory = { ...world.memory }; emit("memory_read", "Load memory into context", "The application explicitly reads preferredSku and includes it in the agent's usable context."); }
  }
  let status: AgentStatus = "failed";
  let message = "The simulation did not complete.";
  let claims: AgentClaim[] = [];
  let pending: { decision: Extract<AgentDecision, { kind: "call" }>; operation: number; retry: number } | undefined;
  let operation = 0;
  let injected = false;
  let overridden = false;
  while (true) {
    const decision = pending?.decision ?? decideAgentAction(context, config.enabledTools);
    if (decision.kind === "finish") {
      emit("decision", decision.status === "needs_input" ? "Authored decision · ask for information" : decision.status === "completed" ? "Authored decision · finish" : "Authored decision · stop", decision.explanation);
      status = decision.status; message = decision.message; claims = decision.claims; break;
    }
    if (metrics.attempts >= config.maxToolAttempts) { status = "limit_reached"; message = "The tool-attempt limit was reached. The task is not being reported as completed."; break; }
    if (!pending) { operation += 1; pending = { decision, operation, retry: 0 }; }
    if (pending.retry) metrics.retries += 1;
    emit("decision", pending.retry ? "Authored decision · retry" : "Authored decision · choose a tool", pending.retry ? "The previous operation did not return a usable observation. Retry within the configured limit; preserve its operation key." : decision.explanation, { toolId: decision.toolId });
    metrics.attempts += 1;
    let input: unknown = decision.input;
    if (!overridden && config.argumentOverride?.toolId === decision.toolId) { input = config.argumentOverride.input; overridden = true; }
    if (config.fault === "invalid-arguments" && !injected) { input = { ...decision.input, [Object.keys(decision.input)[0]]: 42 }; injected = true; }
    const key = `${config.scenarioId}:operation-${pending.operation}${config.reuseOperationKey ? "" : `:attempt-${metrics.attempts}`}`;
    const call: ToolCall = { id: `call-${metrics.attempts}`, name: decision.toolId, input: clone(input), ...(decision.toolId === "create_return_draft" ? { operationKey: key } : {}) };
    emit("tool_request", "Request tool execution", "A structured request is data. The application still has to validate and execute it.", { toolId: call.name, call });
    const validation = validateToolRequest(call, config.enabledTools);
    let result: ToolResult;
    if (!validation.valid) {
      metrics.validationErrors += 1;
      emit("validation", "Request rejected", validation.error!.message, { toolId: call.name, call });
      result = failure(call, validation.error!.code, validation.error!.message);
    } else {
      emit("validation", "Arguments accepted", "The fixed input validator accepts this request. This does not guarantee that the order exists or the action is allowed.", { toolId: call.name, call });
      metrics.executions += 1;
      emit("tool_execution", "Application executes the tool", "The application dispatches this known tool against the local sample store.", { toolId: call.name, call });
      if (config.fault === "always-timeout" || config.fault === "timeout-once" && !injected) {
        injected = true; result = failure(call, "TIMEOUT", "The sample tool timed out before returning a result.", true);
      } else {
        result = await executeTool(call, world, config.enabledTools);
        if (config.fault === "lost-response" && call.name === "create_return_draft" && !injected && result.ok) {
          injected = true; result = failure(call, "TIMEOUT", "The draft was committed, but its response was lost. The caller cannot assume that nothing happened.", true);
        }
      }
    }
    if (!result.ok) metrics.toolErrors += 1;
    emit("tool_result", result.ok ? "Return a matched result" : "Return a matched error", result.ok ? `This result belongs to ${call.id}.` : result.error!.message, { toolId: call.name, call, result });
    context.observations.push({ call: clone(call), result: clone(result) });
    emit("observation", "Add the observation to context", "The next authored decision can use this observation. A failed call is not successful task completion.", { toolId: call.name, call, result });
    if (!result.ok) {
      const repairable = result.error!.retryable || result.error!.code === "INVALID_ARGUMENTS";
      if (repairable && pending.retry < config.maxRetries) {
        if (metrics.attempts >= config.maxToolAttempts) { status = "limit_reached"; message = "The tool-attempt limit was reached before another retry. Completion has not been established."; break; }
        pending.retry += 1;
        emit("retry", "Schedule a bounded retry", result.error!.code === "INVALID_ARGUMENTS" ? "The authored policy repairs the rejected arguments using the original task. The rejected call did not execute." : "Retry the same logical operation; this is another attempt and counts toward the limit.", { toolId: call.name });
        continue;
      }
      status = result.error!.code === "NOT_ELIGIBLE" || result.error!.code === "TOOL_UNAVAILABLE" ? "blocked" : "failed";
      message = `${result.error!.message}${repairable ? " No further retries are permitted." : ""}`;
      break;
    }
    pending = undefined;
  }
  emit("completion", `Simulation · ${status.replace(/_/g, " ")}`, message);
  const run: AgentRun = { config, events, status, message, claims, world, metrics, evaluation: [] };
  run.evaluation = evaluateAgentRun(run);
  return freeze(clone(run));
}
