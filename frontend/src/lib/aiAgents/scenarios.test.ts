import { describe, expect, it } from "vitest";
import { runAgentSimulation } from "./engine";

describe("agent lesson scenarios", () => {
  it("asks for information hidden from the current turn", async () => {
    const full = await runAgentSimulation({ scenarioId: "follow-up", contextMode: "conversation" });
    const current = await runAgentSimulation({ scenarioId: "follow-up", contextMode: "current-turn" });
    expect(full.status).toBe("completed");
    expect(current.status).toBe("needs_input");
    expect(current.metrics.attempts).toBe(0);
  });

  it("loads saved preferences explicitly before using them for a stock lookup", async () => {
    const saved = await runAgentSimulation({ scenarioId: "memory-preference", memoryMode: "saved" });
    const retrieved = await runAgentSimulation({ scenarioId: "memory-preference", memoryMode: "retrieved" });
    expect(saved.world.memory).toHaveProperty("preferredSku", "X200");
    expect(saved.status).toBe("needs_input");
    expect(retrieved.status).toBe("completed");
    expect(retrieved.events.find((event) => event.kind === "memory_read")?.snapshot.context.memory.preferredSku).toBe("X200");
  });

  it("lets builder connections determine which tools can actually run", async () => {
    const run = await runAgentSimulation({ enabledTools: ["lookup_order"] });
    expect(run.status).toBe("blocked");
    expect(run.world.drafts).toHaveLength(0);
    expect(run.events.filter((event) => event.kind === "tool_execution").map((event) => event.toolId)).toEqual(["lookup_order"]);
  });
});
