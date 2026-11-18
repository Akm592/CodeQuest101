import { describe, expect, it } from "vitest";
import { canConnectAgentTool } from "./connections";

describe("builder capabilities", () => {
  it("only connects the agent to a known tool that is not already connected", () => {
    expect(canConnectAgentTool("agent", "get_stock", ["lookup_order"])).toBe(true);
    expect(canConnectAgentTool("agent", "get_stock", ["lookup_order", "get_stock"])).toBe(false);
    for (const [source, target] of [["agent", "agent"], ["get_stock", "lookup_order"], ["agent", "unknown"], [null, "get_stock"]]) {
      expect(canConnectAgentTool(source, target, [])).toBe(false);
    }
  });
});
