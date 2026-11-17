import * as React from "react";

import { cosineSimilarity, RAG_EMBEDDING_INFO, RAG_EMBEDDING_TRACE } from "../../../lib/ml/rag";
import { cn } from "../../../lib/utils";
import { Slider } from "../../ui/slider";
import { Surface } from "../../ui/surface";
import { C } from "../colors";
import { n4, SectionTitle } from "../mathBlocks";

const q = [1, 0];
const DEFAULT_ANGLE_DEG = (Math.atan2(4, 3) * 180) / Math.PI; // ~53.13° -> c = [3, 4], cosine = 0.6
const trace = RAG_EMBEDDING_TRACE;

const ENCODER_STAGES = [
  ["Tokenize", "Split text into pieces; look up each piece’s token ID."],
  ["Look up", "Learned token and position representations form the model’s input."],
  ["Add context", "Transformer layers let token representations depend on surrounding text."],
  ["Pool", "Combine token vectors into one passage vector using a masked mean."],
  ["Normalize", "Divide by the vector’s length so its new length is 1."],
];

export default function RagDetails() {
  const [angleDeg, setAngleDeg] = React.useState(DEFAULT_ANGLE_DEG);
  const rad = (angleDeg * Math.PI) / 180;
  const cxVec = Math.cos(rad) * 5;
  const cyVec = Math.sin(rad) * 5;
  const cosine = cosineSimilarity(q, [cxVec, cyVec]);
  const endX = 115 + Math.cos(rad) * 100;
  const endY = 145 - Math.sin(rad) * 100;
  const arcR = 32;
  const arcX = 115 + Math.cos(rad) * arcR;
  const arcY = 145 - Math.sin(rad) * arcR;
  const largeArc = angleDeg > 180 ? 1 : 0;

  return (
    <section id="rag-deeper" aria-labelledby="rag-deeper-title" className="space-y-4">
      <SectionTitle id="rag-deeper-title" kicker="Open when you are curious" title="Look inside the numbers">
        <p>The walkthrough is enough to explain RAG. These sections show where the numbers come from and the decisions a developer makes.</p>
      </SectionTitle>

      <Surface as="details" variant="card" radius="2xl" className="p-4 sm:p-6">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-foreground">How does text become an embedding?</summary>
        <div className="mt-4 space-y-5 text-sm leading-relaxed text-muted-foreground">
          <p>Think of an embedding as coordinates learned from examples. Related texts often point in similar directions, even when their words differ. The coordinates are not a secret list of labels such as “refund” or “happy”. A single dimension usually has no simple human name.</p>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["1. Train the model earlier", "Training changes weights. MiniLM’s sentence model was fine-tuned with a contrastive objective: identify paired texts among other examples."],
              ["2. Encode new text", "The trained weights stay fixed. Running a passage through the model produces its vector. Adding a document does not retrain the model."],
              ["3. Store the result", "Indexing keeps that vector beside the original text and source. Retrieval can then reuse it for many questions."],
            ].map(([title, detail]) => <Surface key={title} variant="well" className="space-y-2 p-4"><h3 className="font-medium text-foreground">{title}</h3><p>{detail}</p></Surface>)}
          </div>
          <p>This lesson uses <strong className="text-foreground">all-MiniLM-L6-v2</strong>, an embedding model with 384 output numbers. It is separate from the language model that would write an answer. Its encoder follows this path; other models can use different pooling or dimensions.</p>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="MiniLM embedding creation">
            {ENCODER_STAGES.map(([title, detail], i) => <li key={title} className="rounded-xl border border-white/10 p-3"><p className="mb-2 font-semibold text-foreground"><span className="mr-2 text-primary">{i + 1}</span>{title}</p><p className="text-xs">{detail}</p></li>)}
          </ol>
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">A recorded run of the real model</h3>
            <blockquote className="border-l-2 border-primary pl-3 text-foreground">{trace.text}</blockquote>
            <p>The table shows actual token pieces and IDs, followed by the <strong className="text-foreground">first 4 of 384 final contextual components</strong> for each token. The transformer stages above are an illustration; these values were recorded during real inference.</p>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">Recorded MiniLM tokens and four final contextual vector components</caption>
                <thead className="bg-white/5 text-foreground"><tr>{["Token", "ID", "Mask", "d₀", "d₁", "d₂", "d₃"].map((label) => <th key={label} scope="col" className="whitespace-nowrap px-3 py-2 font-medium">{label}</th>)}</tr></thead>
                <tbody className="font-mono tabular-nums">{trace.tokens.map((token, i) => <tr key={i} className="border-t border-white/5"><th scope="row" className="whitespace-nowrap px-3 py-2 font-normal text-foreground">{token.token}</th><td className="px-3 py-2">{token.id}</td><td className="px-3 py-2">{token.mask}</td>{token.components.map((v, j) => <td key={j} className="px-3 py-2">{n4(v)}</td>)}</tr>)}</tbody>
              </table>
            </div>
            <p>The mask is 1 for tokens included in the mean and 0 for padding. This short recorded input needed no padding. Non-padding special tokens such as [CLS] and [SEP] are included, matching this model’s pooling operation.</p>
            <Surface variant="well" className="space-y-2 overflow-x-auto p-4 font-mono text-xs text-foreground">
              <p className="whitespace-nowrap">pooled[d] = sum(mask[t] × token[t][d]) / sum(mask[t])</p>
              <p className="whitespace-nowrap">first four pooled values = [{trace.pooledComponents.map(n4).join(", ")}]</p>
              <p className="whitespace-nowrap">length across all 384 pooled values = {n4(trace.pooledNorm)}</p>
              <p className="whitespace-nowrap">normalized[d] = pooled[d] / {n4(trace.pooledNorm)}</p>
              <p className="whitespace-nowrap">first four normalized values = [{trace.normalizedComponents.map(n4).join(", ")}]</p>
            </Surface>
            <p>For example, component 0 is {n4(trace.pooledComponents[0])} ÷ {n4(trace.pooledNorm)} = <strong className="text-foreground">{n4(trace.normalizedComponents[0])}</strong>. The search still compares all 384 components.</p>
          </div>
          <p>Query means “your search question” in this lesson. It is not the same object as an attention layer’s internal query, key, and value vectors. <a className="text-primary underline underline-offset-4" href="/visualize/attention">Explore self-attention separately.</a></p>
          <details className="rounded-xl border border-white/10 p-3">
            <summary className="min-h-11 cursor-pointer py-2 font-medium text-foreground">Recorded model and reproducibility</summary>
            <dl className="mt-2 grid gap-2 text-xs"><div><dt className="font-medium text-foreground">Model</dt><dd>{RAG_EMBEDDING_INFO.model}</dd></div><div><dt className="font-medium text-foreground">Artifact revision</dt><dd className="break-all font-mono">{RAG_EMBEDDING_INFO.revision}</dd></div><div><dt className="font-medium text-foreground">Corpus fingerprint</dt><dd className="break-all font-mono">{RAG_EMBEDDING_INFO.corpusSha256}</dd></div><div><dt className="font-medium text-foreground">Generation packages</dt><dd>{Object.entries(RAG_EMBEDDING_INFO.packages).map(([name, version]) => `${name} ${version}`).join(" · ")}</dd></div></dl>
            <p className="mt-3">The vectors are bundled. No model is downloaded or executed in your browser. The generation script verifies the model artifacts before creating the fixture.</p>
          </details>
        </div>
      </Surface>

      <Surface as="details" variant="card" radius="2xl" className="p-4 sm:p-6">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-foreground">How does cosine similarity compare two vectors?</summary>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>Cosine compares directions. Arrows pointing the same way score 1, perpendicular arrows score 0, and opposite arrows score −1. For embeddings, a higher score often signals related meaning; it does not prove that a passage answers the question.</p>
          <div className="grid items-center gap-5 md:grid-cols-2">
            <figure className="m-0 space-y-3">
              <svg viewBox="0 0 280 260" role="img" aria-label="Teaching vectors q equals 1 comma 0 and c equals 3 comma 4; their cosine similarity is 0.6" className="mx-auto block h-auto w-full max-w-sm">
                <circle cx={115} cy={145} r={100} fill="none" stroke={C.grid} />
                <path d="M5 145 H255 M115 255 V15" fill="none" stroke={C.grid} />
                {angleDeg > 2 && (
                  <path
                    d={`M ${115 + arcR} 145 A ${arcR} ${arcR} 0 ${largeArc} 0 ${arcX.toFixed(1)} ${arcY.toFixed(1)}`}
                    fill="none"
                    stroke={C.amber}
                    strokeWidth={1.6}
                  />
                )}
                <path d="M115 145 L215 145" stroke={C.sky} strokeWidth={3} />
                <path d={`M115 145 L${endX.toFixed(1)} ${endY.toFixed(1)}`} stroke={C.teal} strokeWidth={3} />
                <circle cx={215} cy={145} r={4} fill={C.sky} />
                <circle cx={endX} cy={endY} r={4.5} fill={C.teal} />
                <text x={187} y={167} fill={C.sky} fontSize={12}>q = [1, 0]</text>
                <text x={Math.min(220, Math.max(16, endX - 18))} y={Math.max(24, endY - 12)} fill={C.teal} fontSize={12}>
                  c = [{cxVec.toFixed(1)}, {cyVec.toFixed(1)}]
                </text>
                <text x={138} y={130} fill={C.amber} fontSize={12}>θ = {Math.round(angleDeg)}°</text>
              </svg>
              <figcaption className="text-center text-xs">Teaching geometry only. Directions are drawn at equal length; these are not projections of the real embeddings.</figcaption>
            </figure>
            <div className="space-y-4">
              <Surface variant="well" className="space-y-3 overflow-x-auto p-4 font-mono text-xs text-foreground">
                <p>cosine(q, c) = dot(q, c) / (length(q) × length(c))</p>
                <p>dot = 1 × {cxVec.toFixed(2)} + 0 × {cyVec.toFixed(2)} = {cxVec.toFixed(2)}</p>
                <p>length(q) = 1; length(c) = 5</p>
                <p>cosine = {cxVec.toFixed(2)} / (1 × 5) = <strong className="text-primary">{cosine.toFixed(2)}</strong></p>
              </Surface>
              <div className="space-y-2.5 rounded-xl border border-white/10 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="rag-cosine-angle" className="font-medium text-foreground">Rotate vector c (angle θ)</label>
                  <output className="font-mono tabular-nums text-primary">{Math.round(angleDeg)}°</output>
                </div>
                <Slider id="rag-cosine-angle" aria-label="Rotate vector c angle" className="min-h-10" value={[angleDeg]} min={0} max={180} step={1} onValueChange={([v]) => setAngleDeg(v)} />
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ["Same (1.0)", 0],
                    ["Example (0.6)", DEFAULT_ANGLE_DEG],
                    ["Perpendicular (0.0)", 90],
                    ["Opposite (−1.0)", 180],
                  ].map(([label, deg]) => (
                    <button
                      key={String(label)}
                      type="button"
                      onClick={() => setAngleDeg(Number(deg))}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-xs transition-colors",
                        Math.abs(angleDeg - Number(deg)) < 1 ? "border-primary/60 bg-primary/15 text-foreground" : "border-white/10 text-muted-foreground hover:bg-white/5",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <p>Normalizing divides a vector by its length without changing its direction. If both vectors have length 1, their dot product already equals cosine similarity. The real search uses complete 384-dimensional vectors, not the four coordinates shown in the preview.</p>
          <p><strong className="text-foreground">0.6 is a similarity score, not “60% certain”.</strong> The scale is model-dependent. A minimum cutoff may remove weak matches but cannot establish that the remaining passages contain the answer.</p>
        </div>
      </Surface>

      <Surface as="details" variant="card" radius="2xl" className="p-4 sm:p-6">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-foreground">What would an experienced developer check?</summary>
        <dl className="mt-4 grid gap-5 text-sm leading-relaxed text-muted-foreground md:grid-cols-2">
          {[
            ["Keep enough context", "Tiny chunks can separate a rule from its condition. Large chunks can mix several topics. This lesson counts sentences; real splitters also consider headings, structure, and model token limits. Overlap preserves continuity but stores duplicate text and can crowd useful evidence out of top-k."],
            ["Retrieve enough, without filling the prompt with noise", "Increasing top-k can recover another part of the answer, but also adds irrelevant text and token cost. Respect the answer model’s context limit; reserve room for the question, instructions, and output."],
            ["Use a compatible embedding space", "Questions and documents must use a compatible model and configuration. Some retrieval models require different query and document prefixes. Changing models usually means re-embedding the documents. This MiniLM setup limits input to 256 word pieces; our short examples fit without truncation."],
            ["Choose retrieval for the job", "This demo compares every chunk exactly. Large indexes often use approximate nearest-neighbour search, trading some recall for faster searches. Exact product IDs can benefit from keyword search; hybrid retrieval combines lexical and semantic results. A reranker can reorder retrieved candidates, but cannot recover a passage absent from its candidate set."],
            ["Keep sources current and access controlled", "Update or delete index entries when source documents change. Filter documents by the user’s permissions before search and ranking, so inaccessible passages cannot enter the results or prompt. Treat retrieved documents as untrusted evidence, never as instructions that override the application."],
            ["Evaluate finding and answering separately", "For questions with labeled evidence, recall@k measures how much expected evidence appears in the retrieved top-k. Then check whether the answer’s claims are supported and citations point to the right passages. Also measure latency and cost. A fluent answer and a high similarity score are not quality tests."],
          ].map(([title, detail]) => <div key={title}><dt className="mb-2 font-semibold text-foreground">{title}</dt><dd>{detail}</dd></div>)}
        </dl>
      </Surface>

      <p className="text-xs leading-relaxed text-muted-foreground">Sources: <a href="https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">MiniLM model card</a> · <a href="https://www.sbert.net/docs/sentence_transformer/usage/semantic_textual_similarity.html" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">Cosine and normalization</a> · <a href="https://www.sbert.net/examples/sentence_transformer/applications/semantic-search/README.html" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">Semantic search</a> · <a href="https://www.sbert.net/examples/sentence_transformer/applications/retrieve_rerank/README.html" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">Retrieve and rerank</a>.</p>
    </section>
  );
}
