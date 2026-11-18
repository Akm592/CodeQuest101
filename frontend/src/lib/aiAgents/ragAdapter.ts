import type { PolicyTopic, SourcePassage } from "./types";

const questions: Record<PolicyTopic, string> = { returns: "exact-id", refunds: "multi-part", warranty: "negation", shipping: "noisy", supplier: "multi-hop", discount: "missing" };

export async function searchPolicyEvidence(topic: PolicyTopic): Promise<SourcePassage[]> {
  // Model fixtures stay outside the general agent engine and are loaded only for a policy search.
  const { runAdvancedExperiment } = await import("../advancedRag/engine");
  const run = runAdvancedExperiment({ queryId: questions[topic] });
  return run.context.passages.map(({ id, source, text, sentenceIds }) => ({ id, source, text, sentenceIds: [...sentenceIds] }));
}
