// Course navigation stays lightweight: model outputs are loaded by the experiment workspace.
export const LESSON_VIEWS = ["understand", "watch", "try", "check"] as const;
export type LessonView = (typeof LESSON_VIEWS)[number];
export type ChapterId = "prepare-text" | "dense-sparse" | "hybrid-search" | "reranking" | "query-strategies" | "graphrag" | "context-evaluation" | "pipeline-lab";

export interface AdvancedLesson {
  id: string;
  title: string;
  defaultQueryId: string;
  idea: string[];
  watchNarrationStages: string[];
  tryInstructions: string[];
  inspector: { why: string; pitfall: string; math: string; pseudocode: string };
  check: { prompt: string; options: string[]; correctIndex: number; explanation: string };
  sources: { title: string; url: string }[];
}
export interface AdvancedChapter {
  id: ChapterId;
  slug: ChapterId;
  title: string;
  headline: string;
  summary: string;
  lessons: AdvancedLesson[];
}

const EMBEDDINGS = { title: "MiniLM model and pooling", url: "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2" };
const BM25 = { title: "BM25 term saturation and length normalization", url: "https://www.elastic.co/docs/reference/elasticsearch/index-settings/similarity" };
const SPARSE = { title: "Sparse semantic representations", url: "https://www.sbert.net/examples/sparse_encoder/applications/semantic_search/README.html" };
const RRF = { title: "Reciprocal rank fusion", url: "https://docs.opensearch.org/latest/vector-search/ai-search/hybrid-search/rrf/" };
const RERANK = { title: "Retrieve and rerank", url: "https://www.sbert.net/examples/sentence_transformer/applications/retrieve_rerank/README.html" };
const HNSW = { title: "The HNSW paper", url: "https://arxiv.org/abs/1603.09320" };
const GRAPH = { title: "GraphRAG local and global search", url: "https://microsoft.github.io/graphrag/query/overview/" };
const SPLITTERS = { title: "Structure-aware text splitting", url: "https://docs.langchain.com/oss/python/integrations/splitters/index" };
const HYDE = { title: "Hypothetical Document Embeddings paper", url: "https://arxiv.org/abs/2212.10496" };
const RETRIEVAL = { title: "Semantic search", url: "https://www.sbert.net/examples/sentence_transformer/applications/semantic-search/README.html" };

export const ADVANCED_CHAPTERS: AdvancedChapter[] = [
  {
    id: "prepare-text", slug: "prepare-text", title: "Prepare text", headline: "Keep the meaning. Lose the noise.",
    summary: "Clean source text, find useful boundaries, and recover the context a small passage needs.",
    lessons: [
      {
        id: "clean", title: "Clean without changing the facts", defaultQueryId: "noisy",
        idea: ["Copied documents often contain repeated footers, broken spacing, and navigation text. Those extra words can compete with the passage that answers a question.", "Remove recognizable noise while preserving the facts: X200, prices, dates, and words such as ‘not’. Cleaning is not the same operation as an embedding model's own tokenization."],
        watchNarrationStages: ["Read the original source, including its repeated boilerplate.", "Normalize spacing and remove the known repeated footer.", "Keep product identifiers, table values, negation, and source identity.", "Compare the useful text with the original before indexing it."],
        tryInstructions: ["Choose the noisy delivery example and compare the original text with its cleaned form.", "Look for the delivery fee and its condition. Both must survive cleaning."],
        inspector: { why: "Useful text gives retrieval a clearer signal, while source identity lets a reader check the answer.", pitfall: "A rule such as ‘remove all numbers’ destroys prices, dates, and product codes. Blanket punctuation or stop-word removal can also alter meaning.", math: "Cleanup changes the input text; it does not update the model's weights.", pseudocode: "clean = normalize_spacing(remove_known_boilerplate(raw))\nassert identifiers_and_conditions_survive(clean)" },
        check: { prompt: "Which cleanup preserves the warranty rule?", options: ["Remove the word ‘not’ to make the passage shorter.", "Remove a repeated page footer and keep ‘accidental damage is not covered’.", "Delete all numbers and product codes."], correctIndex: 1, explanation: "The footer is noise. The negation changes the rule, so it must remain with the relevant text." },
        sources: [SPLITTERS, EMBEDDINGS],
      },
      {
        id: "chunk", title: "Choose meaningful boundaries", defaultQueryId: "noisy",
        idea: ["A chunk is the unit a search can return. A fixed window is simple, but it may split a condition from its rule or a table row from its heading.", "Structure-aware chunks follow document sections. Semantic chunking uses changes in embedding similarity as a clue to topic boundaries. Neither method guarantees the right boundary for every document."],
        watchNarrationStages: ["Start with source sentences and their headings.", "Compare a fixed window with boundaries based on document structure.", "Inspect the recorded embedding similarities between adjacent text units.", "Keep the selected chunk's exact text and source identifiers together."],
        tryInstructions: ["Compare fixed, structure-aware, and semantic chunking on the same question.", "Inspect the passage containing the delivery fee: did it retain the qualifying table heading?"],
        inspector: { why: "A passage should be small enough to retrieve precisely and large enough to carry the information needed to interpret it.", pitfall: "Do not average sentence vectors and call the result the real embedding of a newly joined passage. Each supported passage here has its own recorded model output.", math: "Adjacent-text cosine is a boundary signal, not a universal topic-change threshold.", pseudocode: "boundaries = fixed_windows | headings | semantic_changes\nchunks = preserve_sources(split(text, boundaries))" },
        check: { prompt: "A fee table loses its ‘express delivery’ heading after splitting. What is the main problem?", options: ["The fee may be retrieved without the condition that explains it.", "The chunk must contain too many dimensions.", "A higher cosine score will automatically restore the heading."], correctIndex: 0, explanation: "Search can return only what is in its passages. Preserve the heading or attach parent context so the fee is interpreted correctly." },
        sources: [SPLITTERS, EMBEDDINGS],
      },
      {
        id: "parent", title: "Find small, read enough", defaultQueryId: "multi-part",
        idea: ["A short child passage can be a precise search target. Its larger parent section may contain the conditions needed to answer safely.", "Parent expansion retrieves the child, then adds its surrounding source section to the answer context. That extra context costs space; several children can point to the same parent."],
        watchNarrationStages: ["Find the small child passage that matches the question.", "Follow its parent identifier back to the surrounding section.", "Include the parent text without losing the child's evidence link.", "Deduplicate repeated parents before applying the context budget."],
        tryInstructions: ["Use the return-deadline and refund-timing question. Inspect which conditions sit outside a short matching passage.", "Compare the child and its parent, then inspect the context budget."],
        inspector: { why: "Separate the best unit for finding information from the amount of text needed to understand it.", pitfall: "Adding whole documents for every match can crowd other evidence out of the prompt. Repeating the same parent wastes the budget too.", math: "One parent may contain several retrieved children; include that parent once.", pseudocode: "children = retrieve(question)\ncontext = unique_parents(children)\ncontext = pack_within_budget(context)" },
        check: { prompt: "Two selected child passages share one parent. What should enter the context?", options: ["Two identical copies of the parent.", "Only the parent title, without its text.", "One copy of the relevant parent, retaining the child evidence links."], correctIndex: 2, explanation: "One copy preserves context without spending the budget twice. The evidence identifiers still let the answer cite its actual source." },
        sources: [RETRIEVAL],
      },
    ],
  },
  {
    id: "dense-sparse", slug: "dense-sparse", title: "Dense & sparse", headline: "Two ways to represent a passage.",
    summary: "Inspect dense coordinates, sparse term signals, and a separate graph-based shortcut for finding vectors.",
    lessons: [
      {
        id: "representations", title: "Meaning and term signals", defaultQueryId: "exact-id",
        idea: ["A dense embedding spreads information across many learned coordinates. It can help match a paraphrase even when the wording differs.", "A sparse representation has mostly zero values. BM25 is a classical lexical ranking method based on term statistics; learned sparse encoders can also represent semantic expansions. Sparse does not always mean ‘exact words only’."],
        watchNarrationStages: ["Represent the question and passage in the dense model's compatible space.", "Compare all dense dimensions, rather than a displayed preview.", "Inspect which query terms contribute to the BM25 score.", "Compare an exact product-code question with a paraphrase."],
        tryInstructions: ["Compare dense and sparse results for the X200 question, then choose the paraphrase example.", "Select a passage to inspect its term contributions or dense similarity."],
        inspector: { why: "Representations emphasize different signals. Product identifiers can make lexical evidence valuable, while different wording can make dense retrieval useful.", pitfall: "A dense coordinate is not a named topic. A BM25 score and cosine score use different scales, and neither is an answer-confidence percentage.", math: "BM25 uses term frequency, document frequency, saturation, and length normalization; defaults here are k1 = 1.2 and b = 0.75.", pseudocode: "dense = cosine(query_vector, passage_vector)\nsparse = sum(BM25_contribution(term, passage))" },
        check: { prompt: "Which statement about sparse representations is correct?", options: ["Every sparse model ignores semantic relationships.", "Most coordinates are zero; some learned sparse models also capture semantic signals.", "Sparse and dense scores always have the same numerical scale."], correctIndex: 1, explanation: "Sparsity describes the representation. BM25 is lexical, while learned sparse models can expand or learn semantic terms." },
        sources: [EMBEDDINGS, BM25, SPARSE],
      },
      {
        id: "hnsw", title: "HNSW: navigate nearby vectors", defaultQueryId: "exact-id",
        idea: ["Exact search compares the question with every vector. HNSW uses a hierarchy of proximity links to visit promising neighbours instead.", "This small fixed teaching index shows the layer traversal and candidate queue. Its links describe numeric proximity, not facts such as ‘product uses supplier’. Compare its approximate result with exact search."],
        watchNarrationStages: ["Enter the upper layer of the fixed teaching index.", "Move through promising neighbours using vector distance.", "Descend and keep a bounded set of candidates at the base layer.", "Compare the result and comparison count with the exact baseline."],
        tryInstructions: ["Change the candidate budget and inspect which nodes were visited.", "Compare the returned neighbour with exact search; more exploration can recover a missed neighbour."],
        inspector: { why: "Graph navigation can reduce the number of vector comparisons for large indexes, at the cost of approximate results and additional index storage.", pitfall: "This is a fixed teaching index, not a production HNSW construction benchmark. Its proximity edges are unrelated to GraphRAG's source-backed entity relationships.", math: "Compare approximate top-k with exact top-k on the same points; count actual distance comparisons rather than inventing latency.", pseudocode: "entry = greedy_descent(upper_layers, query)\ncandidates = bounded_search(base_layer, entry, query, ef)" },
        check: { prompt: "What does an edge in this HNSW lesson represent?", options: ["A supplier contract stated in a document.", "Proof that the answer is correct.", "A proximity link used to navigate between vector points."], correctIndex: 2, explanation: "HNSW links help locate nearby vectors. Knowledge-graph relationships describe source-backed facts and belong to the separate GraphRAG chapter." },
        sources: [HNSW],
      },
    ],
  },
  {
    id: "hybrid-search", slug: "hybrid-search", title: "Hybrid search", headline: "Match words. Match meaning.",
    summary: "Combine dense and lexical result lists while keeping their different scoring scales separate.",
    lessons: [{
      id: "fusion", title: "Merge ranks with RRF", defaultQueryId: "exact-id",
      idea: ["One search may find the X200 product code; another may find the opened-packaging rule. Hybrid retrieval gathers candidates from both paths.", "Reciprocal rank fusion, or RRF, combines each passage's positions in those lists. A passage found by both can receive contributions from both, without adding incompatible raw scores."],
      watchNarrationStages: ["Send the same question through dense retrieval and BM25.", "Keep each path's ranked list and source passage identifiers.", "Add reciprocal-rank contributions for passages present in either list.", "Sort the fused scores and inspect why a passage changed position."],
      tryInstructions: ["Compare dense, sparse, and hybrid results for the X200 opened-box question.", "Select a passage and inspect its dense rank, sparse rank, and RRF contributions."],
      inspector: { why: "Rank fusion can retain useful signals from different retrievers even when their raw score scales are unrelated.", pitfall: "A passage missing from one list contributes nothing from that list. A high fused rank still does not prove that its text answers the question.", math: "RRF(d) = Σ 1 / (60 + rank(d)); ranks start at 1. Missing entries contribute 0.", pseudocode: "for list in ranked_lists:\n  for rank, passage in enumerate(list, start=1):\n    fused[passage.id] += 1 / (60 + rank)" },
      check: { prompt: "Why fuse rank positions instead of adding raw BM25 and cosine scores?", options: ["The raw scores measure different signals on different scales.", "Rank fusion guarantees the answer will be correct.", "A missing result should receive the highest possible contribution."], correctIndex: 0, explanation: "Positions are comparable as ranks, while raw scoring scales differ. Fusion improves candidate selection; source evidence still determines what can be answered." },
      sources: [RRF, BM25],
    }],
  },
  {
    id: "reranking", slug: "reranking", title: "Reranking", headline: "Find candidates. Then read more closely.",
    summary: "Inspect how a cross-encoder changes the order of a limited candidate set.",
    lessons: [{
      id: "rerank", title: "Score the question and passage together", defaultQueryId: "exact-id",
      idea: ["The first retriever quickly selects possible passages. A cross-encoder then reads the question and each candidate together to score their relevance more closely.", "This lesson uses recorded real model outputs. Increasing the candidate pool gives the reranker more passages to inspect, but requires more query–passage scoring work."],
      watchNarrationStages: ["Take only the candidate pool produced by the first retrieval stage.", "Pair the original question with each candidate passage.", "Read the recorded cross-encoder score for each pair.", "Sort those candidates again and compare the source evidence."],
      tryInstructions: ["Compare retrieval order with reranking on the same candidates.", "Reduce the pool, then increase it. Check whether the required passage was available to rerank at all."],
      inspector: { why: "A pair model can use interactions between the question and passage that independent embeddings do not score directly.", pitfall: "Reranking cannot recover a passage absent from its candidate pool, and it can still rank incorrectly. Raw model logits are not confidence percentages.", math: "Score each (question, candidate) pair once; sorting never introduces a new passage.", pseudocode: "candidates = retrieve(question)[:pool_size]\nranked = sort_by_cross_encoder(question, candidates)" },
      check: { prompt: "The needed policy is outside the candidate pool. Can reranking alone recover it?", options: ["Yes, because rerankers search the whole collection.", "No. Improve or expand the first-stage candidates first.", "Yes, if a score is displayed as a percentage."], correctIndex: 1, explanation: "The reranker only scores the passages supplied to it. Missing evidence is a retrieval problem before it becomes a ranking problem." },
      sources: [RERANK],
    }],
  },
  {
    id: "query-strategies", slug: "query-strategies", title: "Query strategies", headline: "Ask the index a clearer question.",
    summary: "Compare rewriting, decomposition, and hypothetical search text without mistaking them for evidence.",
    lessons: [{
      id: "strategies", title: "Change the search input", defaultQueryId: "multi-part",
      idea: ["A user's question may be vague, use different terms, or ask for two separate facts. Rewriting can clarify wording; decomposition can search for each part separately.", "HyDE uses hypothetical answer-like text as a search input. Our rewrites and hypothetical passages are authored examples. They are not verified facts and cannot be cited as source evidence."],
      watchNarrationStages: ["Keep the original user question visible.", "Choose an example rewrite, subquestions, or hypothetical search passage.", "Retrieve with the selected search text and combine duplicate results by source identifier.", "Inspect the actual documents before answering the original question."],
      tryInstructions: ["Use the two-part return and refund question; compare the original query with separate subquestions.", "Try the hypothetical passage and check whether it helps retrieval or introduces a misleading assumption."],
      inspector: { why: "The best search input is sometimes more explicit than the original wording, especially when one question contains several information needs.", pitfall: "A rewrite can change intent, omit a negation, or invent an entity. Hypothetical search text is a retrieval aid, never an authoritative answer.", math: "Multiple result lists can be fused by passage ID; reranking still uses the original question.", pseudocode: "search_texts = rewrite | decompose | hypothetical_text\ncandidates = fuse(retrieve(text) for text in search_texts)\nanswer_question = original_question" },
      check: { prompt: "A hypothetical passage says Luma offers student discounts. What can that sentence prove?", options: ["That the shop has a student-discount policy.", "That any retrieved passage about students supports the claim.", "Nothing about the policy; only retrieved source documents can support it."], correctIndex: 2, explanation: "Hypothetical text is generated or authored to guide search. It is not evidence. The handbook must actually state the policy before the answer can cite it." },
      sources: [RETRIEVAL, RRF, HYDE],
    }],
  },
  {
    id: "graphrag", slug: "graphrag", title: "GraphRAG", headline: "Follow relationships back to evidence.",
    summary: "Connect products, suppliers, and policies, then inspect the documents supporting each link.",
    lessons: [{
      id: "graph", title: "Retrieve across connected facts", defaultQueryId: "multi-hop",
      idea: ["One document may name the X200's battery supplier, while another describes that supplier's replacement policy. A knowledge graph links those entities so retrieval can follow the relationship.", "This lesson uses authored, source-backed graph facts and local traversal. Global GraphRAG can instead search community summaries for broader questions; this local demonstration is not that global summary pipeline."],
      watchNarrationStages: ["Find the entities mentioned in the question.", "Follow the selected number of relationship hops.", "Collect the source passages supporting those relationships.", "Read and cite the passages, rather than treating an unlabeled edge as proof."],
      tryInstructions: ["Start at X200 and compare one hop with two hops for the supplier-policy question.", "Select a relationship to inspect its source sentence, then inspect the retrieved evidence."],
      inspector: { why: "Relationships can expose evidence split across documents when a question requires several linked facts.", pitfall: "Entity matching or extraction can be wrong. An edge needs source provenance. These factual relationships are different from an HNSW index's vector-proximity links.", math: "A hop follows one relationship; traversing more hops expands the candidate evidence, not the certainty of the answer.", pseudocode: "entities = question_entities\nrelations = traverse(entities, hop_limit)\npassages = source_passages(relations)" },
      check: { prompt: "What makes a product → supplier relationship useful evidence?", options: ["Its link to a source passage that states the relationship.", "A short distance between its drawn nodes.", "A high number of graph connections, regardless of source text."], correctIndex: 0, explanation: "The source passage supports the relationship. Canvas position is a layout choice, and graph connectivity alone does not establish truth." },
      sources: [GRAPH, HNSW],
    }],
  },
  {
    id: "context-evaluation", slug: "context-evaluation", title: "Context & evaluation", headline: "Keep useful evidence. Measure what survives.",
    summary: "Pack a concise, traceable context and check retrieval separately from answer support.",
    lessons: [
      {
        id: "packing", title: "Spend the context budget wisely", defaultQueryId: "multi-part",
        idea: ["The answer model has limited room for instructions, sources, the question, and its response. Repeated or irrelevant passages spend space that another needed fact could use.", "This teaching experiment packs whole passages within a visible word budget. Real model limits count tokens with a model-specific tokenizer; words here are an explicit proxy, not a claimed token count."],
        watchNarrationStages: ["Start with the selected, optionally reranked passages.", "Remove duplicate passages while retaining their source identifiers.", "Pack whole passages within the teaching word budget.", "Inspect which required evidence made it into the final context."],
        tryInstructions: ["Use the multi-part question and reduce the word budget until one required passage no longer fits.", "Increase the budget and inspect which evidence returns; keep source conditions intact."],
        inspector: { why: "A useful prompt contains enough distinct evidence to answer the question, rather than the largest possible amount of text.", pitfall: "Cutting a passage mid-condition can reverse its meaning. A word budget is not portable to a production model's token limit.", math: "Sum the words of admitted whole passages; the displayed budget covers this teaching context, not a full production prompt.", pseudocode: "for passage in deduplicated_ranked_passages:\n  if words(context + passage) <= budget:\n    include_whole(passage)" },
        check: { prompt: "Why should ‘not covered’ stay with its warranty condition?", options: ["It increases the number of words in the prompt.", "Removing or separating it can change the policy's meaning.", "All short words are required by every tokenizer."], correctIndex: 1, explanation: "Context packing must preserve the fact being communicated. Shorter text is not better when the removed words change the rule." },
        sources: [RETRIEVAL, RERANK],
      },
      {
        id: "evaluate", title: "Finding is different from answering", defaultQueryId: "stale",
        idea: ["A fluent answer can hide missing, stale, or irrelevant evidence. First ask whether retrieval found the labeled sources; then ask whether the answer's claims are supported by the final context.", "The lesson's expected evidence is authored for these examples. It is used to measure results and demonstrate answer support, never to secretly reorder retrieval results."],
        watchNarrationStages: ["Compare retrieved passages with the example's expected evidence.", "Measure how much expected evidence appears in the selected top-k.", "Check what survives context packing and which displayed claims it supports.", "For an unanswered policy, report missing evidence instead of manufacturing a recall score."],
        tryInstructions: ["Use the current-versus-old policy example and inspect the source version, not just its similarity score.", "Choose the missing-policy question. Recall is not applicable when there is no answering source in the corpus."],
        inspector: { why: "Separate measurements reveal whether a failure started in retrieval, context selection, or answering.", pitfall: "Gold evidence must not influence ranking. A citation can point to a related source without supporting the claim. Offline pair and comparison counts are not live latency or monetary cost measurements.", math: "Evidence recall@k = expected evidence found in top-k / expected evidence. With no expected evidence, display N/A.", pseudocode: "retrieval_recall = found_gold / total_gold if total_gold else N/A\ncontext_coverage = evidence_in_final_context\ncheck_claims_against_sources()" },
        check: { prompt: "The corpus never states a student-discount policy. What should evidence recall display?", options: ["100%, because no evidence was needed.", "A made-up percentage based on cosine similarity.", "Not applicable, with a separate check that the answer avoids inventing the policy."], correctIndex: 2, explanation: "The recall denominator is empty. Reporting N/A keeps that mathematical limit visible; whether the answer abstains is a separate behavior to evaluate." },
        sources: [RETRIEVAL, RERANK],
      },
    ],
  },
  {
    id: "pipeline-lab", slug: "pipeline-lab", title: "Pipeline lab", headline: "Follow every decision to its source.",
    summary: "Combine the techniques and inspect exactly where the evidence changes.",
    lessons: [{
      id: "pipeline", title: "Connect the complete pipeline", defaultQueryId: "exact-id",
      idea: ["Advanced RAG is a sequence of decisions: prepare the documents, choose search inputs, retrieve candidates, optionally rerank, and pack source text for an answer.", "Change one decision at a time and follow its consequences. This offline lab computes retrieval and context selection from bundled model outputs; its answer wording and evidence check remain authored simulations."],
      watchNarrationStages: ["Prepare a source-preserving index for the selected chunk strategy.", "Retrieve with dense, sparse, hybrid, or a suitable graph-based path.", "Optionally rerank the candidate pool and pack a bounded context.", "Inspect the simulated answer's citations and identify any missing evidence."],
      tryInstructions: ["Select a pipeline node to change its relevant decision, then compare the same question before and after.", "Try the missing-policy question: additional stages cannot create a policy absent from every source."],
      inspector: { why: "Looking at intermediate results makes a pipeline explainable. You can locate lost evidence instead of guessing which technique to add.", pitfall: "More stages are not automatically better. Check source freshness and permissions before retrieval, and treat retrieved text as untrusted evidence rather than application instructions.", math: "Track candidate counts, pair scores, context words, and evidence coverage. Do not present these offline counts as production latency or cost.", pseudocode: "candidates = retrieve(prepared_index, search_inputs)\nranked = rerank(candidates) if enabled else candidates\ncontext = pack(ranked, budget)\nanswer = simulated_supported_claims(context)" },
      check: { prompt: "A polished answer cites passages that never state its claim. What should you do?", options: ["Inspect the source support and correct or omit the unsupported claim.", "Trust it because the pipeline contains a reranker.", "Increase the similarity score displayed in the UI."], correctIndex: 0, explanation: "Source support is the decisive check. Reranking, graph connections, and fluent wording cannot make an absent fact appear in the documents." },
      sources: [RRF, RERANK, GRAPH],
    }],
  },
];

export function getChapter(slug: string): AdvancedChapter | undefined {
  return ADVANCED_CHAPTERS.find((chapter) => chapter.slug === slug);
}

export function getLesson(chapter: AdvancedChapter, id?: string): AdvancedLesson {
  return chapter.lessons.find((lesson) => lesson.id === id) ?? chapter.lessons[0];
}
