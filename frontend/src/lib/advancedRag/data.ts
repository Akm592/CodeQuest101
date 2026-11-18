import { ADV_DATA } from "./generatedData";
import type { AdvancedChunk, ChunkStrategy } from "./types";

export const ADV_DOCUMENTS = ADV_DATA.documents;
export const ADV_QUERIES = ADV_DATA.queries;
export const ADV_GRAPH = ADV_DATA.graph;
export const ADV_HNSW = ADV_DATA.hnsw;
export const ADV_MODEL_INFO = ADV_DATA.metadata;

export function getAdvancedIndex(strategy: ChunkStrategy): AdvancedChunk[] {
  const index = ADV_DATA.indexes[strategy];
  if (!index) throw new RangeError("Choose fixed, structure, or semantic chunking.");
  return index;
}

export function getQueryEmbedding(exactText: string): number[] {
  const vector = ADV_DATA.queryEmbeddings[exactText];
  if (!vector) throw new RangeError("Choose a recorded Luma Shop question or query variant.");
  return vector;
}

export function getRerankScore(exactOriginalQuestion: string, chunkId: string): number {
  const score = ADV_DATA.rerankerScores[exactOriginalQuestion]?.[chunkId];
  if (!Number.isFinite(score)) throw new RangeError("No recorded reranker score exists for this question and passage.");
  return score;
}
