import type { RagIndexedChunk } from "../ml/rag";

export type ChunkStrategy = "fixed" | "structure" | "semantic";
export interface AdvancedSentence { id: string; text: string; heading: string }
export interface AdvancedDocument {
  id: string;
  title: string;
  kind: string;
  version: string;
  current: boolean;
  rawText: string;
  sentences: AdvancedSentence[];
}
export interface AdvancedChunk extends RagIndexedChunk {
  strategy: ChunkStrategy;
  heading: string;
  parentId: string;
  parentText: string;
  parentSentenceIds: string[];
}
export interface AdvancedQuery {
  id: string;
  label: string;
  text: string;
  claims: { text: string; evidenceIds: string[] }[];
  rewritten: string;
  subqueries: string[];
  hyde: string;
  seedEntityIds: string[];
}
export interface KnowledgeGraph {
  entities: { id: string; label: string; type: string }[];
  relations: { id: string; from: string; to: string; label: string; evidenceIds: string[] }[];
}
export interface HnswTeachingIndex {
  description: string;
  nodes: { id: string; vector: [number, number]; level: number }[];
  layers: { level: number; neighbors: Record<string, string[]> }[];
  entryPoint: string;
  query: [number, number];
}
export interface AdvancedDataset {
  documents: AdvancedDocument[];
  queries: AdvancedQuery[];
  graph: KnowledgeGraph;
  hnsw: HnswTeachingIndex;
  indexes: Record<ChunkStrategy, AdvancedChunk[]>;
  queryEmbeddings: Record<string, number[]>;
  rerankerScores: Record<string, Record<string, number>>;
  metadata: {
    encoder: { model: string; revision: string; artifactSource: string; artifactSha256: Record<string, string>; dimensions: number; maximumTokens: number; pooling: string };
    reranker: { model: string; revision: string; artifactSource: string; artifactSha256: Record<string, string>; maximumTokens: number; output: string };
    corpusSha256: string;
    inputsSha256: string;
    packages: Record<string, string>;
    semanticThreshold: number;
    generation: string;
  };
}
