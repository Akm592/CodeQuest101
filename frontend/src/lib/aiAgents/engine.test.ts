import { describe, expect, it } from "vitest";
import { AGENT_SCENARIOS, createAgentWorld, decideAgentAction, evaluateAgentRun, getScenarioConfig, runAgentSimulation, runToolSandbox, validateToolInput, validateToolRequest, type AgentConfig, type AgentContext, type AgentRun } from "./engine";

describe("agent tool contracts", () => {
  it("validates only the fixed tool contracts, including required values, enums and unexpected fields", () => {
    expect(validateToolInput("lookup_order", { orderId: "L-1001" }).valid).toBe(true);
    for (const input of [null, [], "L-1001", {}, { orderId: 42 }, { orderId: " " }, { orderId: "L-1001", extra: true }]) expect(validateToolInput("lookup_order", input).valid).toBe(false);
    expect(validateToolInput("search_policies", { topic: "invented" }).valid).toBe(false);
    expect(validateToolInput("get_stock", { sku: "X200" }).valid).toBe(true);
    expect(validateToolInput("toString", {}).error?.code).toBe("TOOL_UNAVAILABLE");
  });

  it("computes order and inventory results without mutating its input store", async () => {
    const world = createAgentWorld();
    const order = await runToolSandbox("lookup_order", { orderId: "L-1002" }, world);
    expect(order.result.data?.order).toMatchObject({ id: "L-1002", used: true, daysSinceDelivery: 14 });
    expect(order.result.toolUseId).toBe(order.call.id);
    expect((await runToolSandbox("get_stock", { sku: "P100" })).result.data?.stock?.available).toBe(0);
    expect((await runToolSandbox("lookup_order", { orderId: "missing" })).result.error?.code).toBe("NOT_FOUND");
    expect((await runToolSandbox("lookup_order", { orderId: 42 })).result.error?.code).toBe("INVALID_ARGUMENTS");
    expect(world.drafts).toEqual([]);
  });

  it("enforces connected capabilities in the application dispatcher even for a forged known-tool request", async () => {
    const input = { orderId: "L-1001", reason: "Unused item." };
    expect(validateToolInput("create_return_draft", input).valid).toBe(true);
    expect(validateToolRequest({ id: "forged", name: "create_return_draft", input }, ["lookup_order"]).error?.code).toBe("TOOL_UNAVAILABLE");
    const rejected = await runToolSandbox("create_return_draft", input, undefined, "forged-operation", ["lookup_order"]);
    expect(rejected.result.error?.code).toBe("TOOL_UNAVAILABLE");
    expect(rejected.world.drafts).toEqual([]);
  });

  it("enforces eligibility at the action boundary, including the 30-day boundary", async () => {
    const world = createAgentWorld();
    const input = { orderId: "L-1001", reason: "Item unused." };
    world.orders[0].daysSinceDelivery = 30;
    expect((await runToolSandbox("create_return_draft", input, world)).result.ok).toBe(true);
    world.orders[0].daysSinceDelivery = 31;
    expect((await runToolSandbox("create_return_draft", input, world)).result.error?.code).toBe("NOT_ELIGIBLE");
    for (const orderId of ["L-1002", "L-1003"]) expect((await runToolSandbox("create_return_draft", { ...input, orderId })).result.error?.code).toBe("NOT_ELIGIBLE");
  });

  it("reuses the stored result for one operation key and rejects changed intent", async () => {
    const input = { orderId: "L-1001", reason: "Unused item." };
    const first = await runToolSandbox("create_return_draft", input, undefined, "same-intent");
    const retry = await runToolSandbox("create_return_draft", input, first.world, "same-intent");
    expect(retry.world.drafts).toHaveLength(1);
    expect(retry.result.data).toMatchObject({ idempotentReplay: true, draft: { id: "draft-1" } });
    expect((await runToolSandbox("create_return_draft", { ...input, reason: "Different reason" }, retry.world, "same-intent")).result.error?.code).toBe("KEY_CONFLICT");
    expect(first.world.drafts).toHaveLength(1);
  });
});

describe("authored decisions and complete runs", () => {
  it("cannot infer hidden order or stock facts without visible context", () => {
    const context: AgentContext = { task: { preset: "eligibility", text: "Can I return it?", orderId: "", sku: "", policyTopic: "returns" }, observations: [], memory: {} };
    expect(decideAgentAction(context, ["lookup_order", "search_policies"]).kind).toBe("finish");
    expect(decideAgentAction(context, ["lookup_order", "search_policies"])).toMatchObject({ status: "needs_input", claims: [] });
    context.task.orderId = "L-1001";
    expect(decideAgentAction(context, ["lookup_order", "search_policies"])).toMatchObject({ kind: "call", toolId: "lookup_order" });
    expect(decideAgentAction(context, [])).toMatchObject({ status: "blocked" });
  });

  it("completes the default draft with genuine retrieval evidence and an actual stored record", async () => {
    const run = await runAgentSimulation();
    expect(run.status).toBe("completed");
    expect(run.world.drafts).toHaveLength(1);
    expect(run.world.drafts[0].orderId).toBe("L-1001");
    expect(run.metrics).toMatchObject({ attempts: 3, executions: 3, retries: 0, validationErrors: 0, draftsCreated: 1 });
    expect(run.evaluation.every((check) => check.passed)).toBe(true);
    expect(run.events.at(-2)).toMatchObject({ kind: "decision", title: "Authored decision · finish" });
    expect(run.claims.flatMap((claim) => claim.evidenceIds)).toEqual(expect.arrayContaining(["D1-s1", "D1-s2", "D2-s1"]));
    for (const event of run.events.filter((item) => item.result)) expect(event.result!.toolUseId).toBe(event.call!.id);
  });

  it("resolves partial scenario settings before overrides and refuses used/expired items", async () => {
    for (const [scenarioId, orderId] of [["used-item", "L-1002"], ["expired-return", "L-1003"]] as const) {
      const run = await runAgentSimulation({ scenarioId });
      expect(run.config.orderId).toBe(orderId);
      expect(run.status).toBe("blocked");
      expect(run.world.drafts).toHaveLength(0);
      expect(run.claims[0].eligibility).toMatchObject({ orderId, eligible: false });
      expect(run.evaluation.find((check) => check.id === "outcome")?.passed).toBe(true);
    }
  });

  it("uses only the requested inventory tool and matches any edited arguments to the actual requested target", async () => {
    const stock = await runAgentSimulation({ scenarioId: "stock-check" });
    expect(stock.metrics.attempts).toBe(1);
    expect(stock.claims[0].stock).toMatchObject({ sku: "X200", available: 12 });
    expect(stock.events.filter((event) => event.kind === "tool_request").map((event) => event.call!.name)).toEqual(["get_stock"]);
    const edited = await runAgentSimulation({ scenarioId: "stock-check", argumentOverride: { toolId: "get_stock", input: { sku: "P100" } } });
    expect(edited.metrics.attempts).toBe(2);
    expect(edited.claims[0].stock).toMatchObject({ sku: "X200", available: 12 });
  });

  it("asks for missing information and reports unavailable records without fabricating success", async () => {
    const missing = await runAgentSimulation({ scenarioId: "missing-order" });
    expect(missing.status).toBe("needs_input"); expect(missing.metrics.executions).toBe(0);
    const unknown = await runAgentSimulation({ scenarioId: "unknown-order" });
    expect(unknown.status).toBe("failed"); expect(unknown.claims).toEqual([]);
    expect(unknown.events.some((event) => event.result?.error?.code === "NOT_FOUND")).toBe(true);
    const disconnected = await runAgentSimulation({ enabledTools: ["lookup_order"] });
    expect(disconnected.status).toBe("blocked"); expect(disconnected.world.drafts).toEqual([]);
  });

  it("does not turn unrelated retrieved passages into a student discount policy", async () => {
    const run = await runAgentSimulation({ scenarioId: "missing-policy" });
    expect(run.events.some((event) => (event.result?.data?.passages?.length ?? 0) > 0)).toBe(true);
    expect(run.status).toBe("blocked"); expect(run.claims).toEqual([]);
    expect(run.evaluation.find((check) => check.id === "outcome")?.passed).toBe(true);
  });

  it("actually changes the follow-up decision when previous context is omitted", async () => {
    const included = await runAgentSimulation({ scenarioId: "follow-up" });
    const omitted = await runAgentSimulation({ scenarioId: "follow-up", contextMode: "current-turn" });
    expect(included.status).toBe("completed");
    expect(included.metrics.attempts).toBe(1);
    expect(included.claims[0].eligibility?.orderId).toBe("L-1001");
    expect(omitted.status).toBe("needs_input"); expect(omitted.metrics.attempts).toBe(0);
  });

  it("distinguishes stored memory from memory explicitly read into a new context", async () => {
    const saved = await runAgentSimulation({ scenarioId: "memory-preference", memoryMode: "saved" });
    const loaded = await runAgentSimulation({ scenarioId: "memory-preference", memoryMode: "retrieved" });
    expect(saved.world.memory.preferredSku).toBe("X200");
    expect(saved.status).toBe("needs_input"); expect(saved.metrics.attempts).toBe(0);
    expect(loaded.status).toBe("completed"); expect(loaded.claims[0].stock?.sku).toBe("X200");
    expect(loaded.events.filter((event) => event.kind.startsWith("memory") || event.kind === "new_conversation").map((event) => event.kind)).toEqual(["memory_write", "new_conversation", "memory_read"]);
    const newConversation = loaded.events.find((event) => event.kind === "new_conversation")!;
    expect(newConversation.snapshot.context.memory).toEqual({});
    expect(newConversation.snapshot.world.memory).toEqual({ preferredSku: "X200" });
  });
});

describe("failures, limits, idempotency and immutable playback", () => {
  it("repairs invalid arguments before any execution and counts a real retry", async () => {
    const run = await runAgentSimulation({ scenarioId: "invalid-arguments" });
    expect(run.status).toBe("completed");
    expect(run.metrics).toMatchObject({ attempts: 3, executions: 2, validationErrors: 1, retries: 1 });
    const first = run.events.find((event) => event.result)!;
    expect(first.result?.error?.code).toBe("INVALID_ARGUMENTS");
    expect(first.snapshot.metrics.executions).toBe(0);
  });

  it("recovers from a transient timeout while respecting per-operation retry settings", async () => {
    const recovered = await runAgentSimulation({ scenarioId: "tool-timeout" });
    expect(recovered.status).toBe("completed"); expect(recovered.metrics.retries).toBe(1);
    const noRetry = await runAgentSimulation({ scenarioId: "tool-timeout", maxRetries: 0 });
    expect(noRetry.status).toBe("failed"); expect(noRetry.metrics).toMatchObject({ attempts: 1, retries: 0 });
    const permanent = await runAgentSimulation({ fault: "always-timeout", maxRetries: 2 });
    expect(permanent.status).toBe("failed"); expect(permanent.metrics).toMatchObject({ attempts: 3, retries: 2 });
  });

  it("does not count or schedule a retry when the total attempt budget is exhausted", async () => {
    const run = await runAgentSimulation({ scenarioId: "lost-response", maxToolAttempts: 3 });
    expect(run.status).toBe("limit_reached");
    expect(run.metrics).toMatchObject({ attempts: 3, retries: 0, draftsCreated: 1 });
    expect(run.events.some((event) => event.kind === "retry")).toBe(false);
    expect(run.claims).toEqual([]);
    expect(run.evaluation.find((check) => check.id === "outcome")?.passed).toBe(false);
  });

  it("uses different call IDs but one logical operation key after a lost committed response", async () => {
    const run = await runAgentSimulation({ scenarioId: "lost-response" });
    expect(run.status).toBe("completed"); expect(run.world.drafts).toHaveLength(1);
    const calls = run.events.filter((event) => event.kind === "tool_request" && event.call?.name === "create_return_draft").map((event) => event.call!);
    expect(calls).toHaveLength(2);
    expect(calls[0].id).not.toBe(calls[1].id);
    expect(calls[0].operationKey).toBe(calls[1].operationKey);
    const badKey = await runAgentSimulation({ scenarioId: "lost-response", reuseOperationKey: false });
    expect(badKey.world.drafts).toHaveLength(2);
    expect(badKey.evaluation.find((check) => check.id === "effects")?.passed).toBe(false);
  });

  it("keeps every earlier snapshot unchanged, including before a draft commit", async () => {
    const run = await runAgentSimulation();
    const before = run.events.find((event) => event.kind === "tool_execution" && event.call?.name === "create_return_draft")!;
    expect(before.snapshot.world.drafts).toHaveLength(0);
    expect(run.events.at(-1)!.snapshot.world.drafts).toHaveLength(1);
    const encoded = JSON.stringify(run);
    [...run.events].reverse().forEach((event) => { void event.snapshot.world.drafts.length; });
    expect(JSON.stringify(run)).toBe(encoded);
    expect(Object.isFrozen(run.events)).toBe(true);
    expect(() => before.snapshot.world.drafts.push(run.world.drafts[0])).toThrow();
    const again = await runAgentSimulation();
    expect(again.world.drafts).toHaveLength(1);
    expect(again.world.drafts[0].id).toBe("draft-1");
  });

  it("evaluates structured outcomes and source-to-call linkage rather than final-answer wording", async () => {
    const run = await runAgentSimulation({ taskPreset: "eligibility" });
    const fabricated = structuredClone(run);
    fabricated.claims[0].eligibility!.eligible = false;
    expect(evaluateAgentRun(fabricated).find((check) => check.id === "outcome")?.passed).toBe(false);
    const badCitation = structuredClone(run);
    badCitation.claims[0].toolCallIds = ["call-1"];
    expect(evaluateAgentRun(badCitation).find((check) => check.id === "evidence")?.passed).toBe(false);
    const absentPolicySupport = structuredClone(run);
    absentPolicySupport.claims[0].evidenceIds = [];
    absentPolicySupport.claims[0].toolCallIds = ["call-1"];
    expect(evaluateAgentRun(absentPolicySupport).find((check) => check.id === "evidence")?.passed).toBe(false);
    const wrongStock = structuredClone(await runAgentSimulation({ scenarioId: "stock-check" }));
    wrongStock.claims[0].text = "X200: 999 available.";
    expect(evaluateAgentRun(wrongStock).find((check) => check.id === "evidence")?.passed).toBe(false);
    wrongStock.claims[0].stock!.available = 999;
    expect(evaluateAgentRun(wrongStock).find((check) => check.id === "evidence")?.passed).toBe(false);
    const polishedButAbsent = structuredClone(await runAgentSimulation());
    polishedButAbsent.world.drafts = [];
    expect(evaluateAgentRun(polishedButAbsent).find((check) => check.id === "outcome")?.passed).toBe(false);
  });

  it("validates settings and returns finite bounded traces for every authored scenario", async () => {
    for (const scenario of AGENT_SCENARIOS) {
      const run = await runAgentSimulation(getScenarioConfig(scenario.id));
      expect(run.metrics.attempts).toBeLessThanOrEqual(run.config.maxToolAttempts);
      expect(new Set(run.events.map((event) => event.id)).size).toBe(run.events.length);
      expect(run.events.at(-1)?.kind).toBe("completion");
    }
    await expect(runAgentSimulation({ maxToolAttempts: 0 as 3 })).rejects.toThrow(RangeError);
    await expect(runAgentSimulation({ enabledTools: ["toString" as "lookup_order"] })).rejects.toThrow(RangeError);
    await expect(runAgentSimulation({ scenarioId: "unknown" as AgentConfig["scenarioId"] })).rejects.toThrow(RangeError);
    const run: AgentRun = await runAgentSimulation({ enabledTools: [] });
    expect(run.status).toBe("blocked");
  });
});
