import type { RagStep } from "../ml/rag";
import ragPy from "./python/rag.py?raw";
import type { AlgorithmGuide } from "./types";

export const ragGuide: AlgorithmGuide = {
  title: "RAG: Retrieval-Augmented Generation",
  whenToUseHeading: "Where you'll meet it",
  idea: [
    "Think of an open-book exam. Before answering a question, find the useful pages and place them beside the question. RAG does those two jobs: retrieve useful passages, then ask a language model to answer using them.",
    "First prepare the documents: split them into passages called chunks, turn each chunk into a vector (a list of numbers), and store that vector with its text and source. A trained embedding model creates the vectors. Adding a document runs that model; it does not train it again.",
    "For each question, create a compatible question vector, compare it with the chunk vectors, and retrieve the best matches. Put the original passages into the answer model's prompt. The answer model reads text, rather than the embedding numbers.",
    "This page searches real, recorded MiniLM embeddings in all 384 dimensions. The answer is an authored simulation that checks known evidence for these six questions. It demonstrates full, partial, and missing evidence; a real language model still needs evaluation because it can make unsupported claims.",
  ],
  whenToUse: [
    "Answering questions about a company's handbook, product documentation, or a collection of research papers.",
    "Using information that changes without retraining the answer model: update the documents and their index instead.",
    "Giving readers a route back to the source of an answer. A citation helps them check a claim; the citation alone does not prove it is supported.",
  ],
  stages: [
    { id: "docs", title: "Start with source documents", detail: "The shop's handbook holds its rules. RAG can only retrieve from information made available to it.", pseudo: "documents = load_sources()" },
    { id: "chunk", title: "Split each document into passages", detail: "A small passage is easier to retrieve precisely. Overlap repeats some text so a rule is less likely to be separated from its explanation.", pseudo: "chunks = split(documents, size, overlap)" },
    { id: "embed", title: "Turn passages into vectors", detail: "Run the already trained embedding model on each chunk. Here MiniLM produces 384 numbers per passage; its learned dimensions do not have simple names.", pseudo: "vectors = embed(chunks.text)" },
    { id: "index", title: "Store vectors beside their sources", detail: "Keep each vector with the passage text and its source identity. Reuse this prepared index for new questions; update it when its documents or embedding setup change.", pseudo: "index = store(chunks, vectors, sources)" },
    { id: "query", title: "Embed the question", detail: "Represent the search question in a compatible embedding space. This search question is different from the internal query, key, and value vectors used by attention.", pseudo: "question_vector = embed_query(question)" },
    { id: "score", title: "Compare every chunk", detail: "Cosine similarity compares vector directions. This demo uses every dimension, then sorts the scores. A high score is a useful match, not a probability that the passage answers the question.", pseudo: "ranked = sort_by_cosine(question_vector, index)" },
    { id: "retrieve", title: "Keep the best eligible passages", detail: "Apply the optional minimum score and keep up to top-k passages. A stricter cutoff or smaller top-k can remove useful evidence as well as irrelevant text.", pseudo: "context = eligible(ranked, cutoff)[:top_k]" },
    { id: "prompt", title: "Put evidence beside the question", detail: "Send the selected text, source labels, question, and instructions to the answer model. Treat document text as evidence, not instructions to follow.", pseudo: "prompt = instructions + context + question" },
    { id: "answer", title: "Answer what the evidence supports", detail: "This simulation displays only authored claims whose required sentences were retrieved. It cites those passages and says when evidence is partial or missing. Real LLMs do not automatically have this evidence check.", pseudo: "answer = generate_with_sources(prompt)  # simulated here" },
  ],
  legend: [
    { tone: "current", label: "Current pipeline stage" },
    { tone: "compare", label: "Vector comparisons" },
    { tone: "found", label: "Selected evidence" },
    { tone: "idle", label: "Not selected" },
  ],
  complexity: {
    time: "O(n × d + n log n) per search",
    space: "O(n × d + source text) for the index",
    why: "For n chunks and d vector dimensions, this exact search compares every vector and sorts all n scores. Embedding computation and answer generation have their own model costs. Large systems often use approximate indexes; RAG does not require a particular vector database.",
  },
  pitfalls: [
    "Related text may not contain an answer. Try the late-delivery refund question: matching refund and delivery passages do not establish a late-delivery refund policy.",
    "Tiny chunks can lose qualifiers; large chunks can mix several topics. Overlap helps at some boundaries but also repeats text and uses more storage and context.",
    "Top-k is a passage count, not a quality guarantee. A similarity cutoff is also only a retrieval rule; there is no universal score that proves a passage is sufficient.",
    "Use compatible document and question embeddings. Changing the model, its prompts, or its preprocessing may require re-embedding the index. Check token limits so important text is not silently truncated.",
    "Check access permissions before searching, keep sources current, and treat retrieved text as untrusted input. RAG does not automatically solve privacy, prompt injection, or incorrect answers.",
    "Measure retrieval and answers separately: did retrieval find the required evidence, and does each answer claim have support? More fluent writing cannot repair missing evidence.",
  ],
  tryThis: [
    "Choose 'Different words, same idea' and inspect which passage answers the question even though its wording is different.",
    "Choose the chunk-boundary question, set chunk size to 3 and top-k to 1, and compare overlap 0 with overlap 1. The repeated sentence lets one selected passage contain both halves of the rule.",
    "Choose 'Two documents are needed'. The default settings provide a partial answer. Set chunk size to 3 and top-k to 3 to retrieve evidence for both parts; leave the minimum score off.",
    "Enable the minimum similarity cutoff and set it to 1. No handbook passage in these examples reaches that score, so none is selected. Turn it off and inspect the returned passages again.",
    "Choose the student-discount question. Even the nearest available passage cannot supply a policy that the handbook never states.",
  ],
  python: ragPy,
};

export const ragGuideStepFor = (step: RagStep) => step.phase;
