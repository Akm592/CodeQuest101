"""Generate real recorded outputs for the offline Advanced RAG course.

Generation-only dependencies: Python 3.13, numpy==2.5.5,
onnxruntime==1.32.0, tokenizers==0.23.3. Frontend builds never run this.

Encoder artifact: https://chroma-onnx-models.s3.amazonaws.com/all-MiniLM-L6-v2/onnx.tar.gz
Reranker files (model.onnx is in onnx/; other files are at the repository root):
https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2/tree/233902d25c440f23af6f7d6e94d2946bac0bee0a

Run: python scripts/generate_advanced_rag_data.py --encoder-dir /path/to/onnx --reranker-dir /path/to/reranker
Append --check to verify byte-identical regeneration without changing the fixture.
The script rejects artifacts with different fingerprints, silently truncated
inputs, unsupported evidence, and non-finite outputs. Model weights stay outside
the source tree; only outputs and provenance are committed.
"""

import argparse
import hashlib
import importlib.metadata
import json
import platform
import re
from pathlib import Path


ENCODER_HASHES = {
    "model.onnx": "4f148ba8ae9c2c7fbee4af2b132db8d06c6a6545b47fc83bbb98c3d22b8393e6",
    "tokenizer.json": "da0e79933b9ed51798a3ae27893d3c5fa4a201126cef75586296df9b4d2c62a0",
    "config.json": "b567c7d5a55b636c95186aaf993f9a8920842b7e05a9e703e68b23cab2c3a670",
}
RERANKER_HASHES = {
    "model.onnx": "5d3e70fd0c9ff14b9b5169a51e957b7a9c74897afd0a35ce4bd318150c1d4d4a",
    "tokenizer.json": "d241a60d5e8f04cc1b2b3e9ef7a4921b27bf526d9f6050ab90f9267a1f9e5c66",
    "config.json": "380e02c93f431831be65d99a4e7e5f67c133985bf2e77d9d4eba46847190bacc",
}
RERANKER_REVISION = "233902d25c440f23af6f7d6e94d2946bac0bee0a"
SEMANTIC_THRESHOLD = 0.35


def sha256(value):
    return hashlib.sha256(value).hexdigest()


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def validate_sources(corpus):
    docs = corpus["documents"]
    queries = corpus["queries"]
    sentences = [s for d in docs for s in d["sentences"]]
    sentence_ids = {s["id"] for s in sentences}
    entity_ids = {e["id"] for e in corpus["graph"]["entities"]}
    assert len({d["id"] for d in docs}) == len(docs)
    assert len(sentence_ids) == len(sentences)
    assert len({q["id"] for q in queries}) == len(queries) == 8
    assert all(type(d["current"]) is bool for d in docs)
    for q in queries:
        assert q["text"] and q["rewritten"] and q["subqueries"] and q["hyde"]
        assert set(q["seedEntityIds"]) <= entity_ids
        for claim in q["claims"]:
            assert claim["evidenceIds"] and set(claim["evidenceIds"]) <= sentence_ids
    for edge in corpus["graph"]["relations"]:
        assert edge["from"] in entity_ids and edge["to"] in entity_ids
        assert edge["evidenceIds"] and set(edge["evidenceIds"]) <= sentence_ids
    nodes = {n["id"]: n for n in corpus["hnsw"]["nodes"]}
    assert corpus["hnsw"]["entryPoint"] in nodes
    for layer in corpus["hnsw"]["layers"]:
        members = {id for id, node in nodes.items() if node["level"] >= layer["level"]}
        assert set(layer["neighbors"]) == members
        for id, neighbors in layer["neighbors"].items():
            assert set(neighbors) <= members and id not in neighbors
            assert all(id in layer["neighbors"][other] for other in neighbors)


def build_chunks(documents, strategy, sentence_vectors):
    result = []
    for doc in documents:
        sentences = doc["sentences"]
        groups = []
        if strategy == "fixed":
            groups = [sentences[i:i + 3] for i in range(0, len(sentences), 3)]
        elif strategy == "structure":
            # A sentence is a targeted child; its heading section is parent context.
            groups = [[s] for s in sentences]
        else:
            for sentence in sentences:
                if not groups:
                    groups.append([sentence])
                    continue
                previous = groups[-1][-1]
                score = sum(a * b for a, b in zip(sentence_vectors[previous["id"]], sentence_vectors[sentence["id"]]))
                if previous["heading"] != sentence["heading"] or score < SEMANTIC_THRESHOLD or len(groups[-1]) >= 3:
                    groups.append([sentence])
                else:
                    groups[-1].append(sentence)
        for group_index, group in enumerate(groups):
            headings = list(dict.fromkeys(s["heading"] for s in group))
            parent = [s for s in sentences if len(headings) > 1 or s["heading"] == headings[0]]
            section = "document" if len(headings) > 1 else re.sub(r"[^a-z0-9]+", "-", headings[0].lower()).strip("-")
            result.append({
                "id": f'{doc["id"]}-{strategy}-{group_index + 1}',
                "documentId": doc["id"], "source": doc["title"],
                "strategy": strategy, "heading": " / ".join(headings),
                "sentenceIds": [s["id"] for s in group],
                "text": " ".join(s["text"] for s in group),
                "parentId": f'{doc["id"]}-{section}',
                "parentText": " ".join(s["text"] for s in parent),
                "parentSentenceIds": [s["id"] for s in parent],
            })
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--encoder-dir", type=Path, required=True)
    parser.add_argument("--reranker-dir", type=Path, required=True)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    import numpy as np
    import onnxruntime as ort
    from tokenizers import Tokenizer

    root = Path(__file__).resolve().parent.parent
    corpus_path = root / "scripts/fixtures/advanced-rag-corpus.json"
    corpus = json.loads(corpus_path.read_text())
    validate_sources(corpus)
    options = ort.SessionOptions()
    options.intra_op_num_threads = options.inter_op_num_threads = 1

    def load(directory, fingerprints):
        for name, expected in fingerprints.items():
            if sha256((directory / name).read_bytes()) != expected:
                raise ValueError(f"Unexpected artifact: {directory / name}")
        tokenizer = Tokenizer.from_file(str(directory / "tokenizer.json"))
        # Detect over-length input before any truncation, rather than accepting clipped text.
        tokenizer.no_truncation()
        tokenizer.no_padding()
        session = ort.InferenceSession(str(directory / "model.onnx"), sess_options=options, providers=["CPUExecutionProvider"])
        return tokenizer, session

    encoder_tokenizer, encoder = load(args.encoder_dir, ENCODER_HASHES)
    rerank_tokenizer, reranker = load(args.reranker_dir, RERANKER_HASHES)

    def infer(tokenizer, session, first, second=None, limit=256):
        item = tokenizer.encode(first, second)
        if len(item.ids) > limit:
            raise ValueError(f"Input exceeds {limit} tokens; refusing silent truncation")
        inputs = {"input_ids": np.array([item.ids], dtype=np.int64),
                  "attention_mask": np.array([item.attention_mask], dtype=np.int64),
                  "token_type_ids": np.array([item.type_ids], dtype=np.int64)}
        output = session.run(None, {n.name: inputs[n.name] for n in session.get_inputs()})[0]
        if not np.isfinite(output).all():
            raise ValueError("Model returned non-finite output")
        return output, np.array(item.attention_mask, dtype=np.float32)

    vector_cache = {}
    def embed(text):
        if text not in vector_cache:
            hidden, mask = infer(encoder_tokenizer, encoder, text)
            pooled = (hidden[0] * mask[:, None]).sum(axis=0) / mask.sum()
            vector = pooled / np.linalg.norm(pooled)
            assert vector.shape == (384,) and np.isfinite(vector).all()
            vector_cache[text] = [round(float(v), 9) for v in vector]
            assert abs(sum(v * v for v in vector_cache[text]) - 1) < 1e-6
        return vector_cache[text]

    sentence_vectors = {s["id"]: embed(s["text"]) for d in corpus["documents"] for s in d["sentences"]}
    indexes = {strategy: build_chunks(corpus["documents"], strategy, sentence_vectors)
               for strategy in ("fixed", "structure", "semantic")}
    for chunks in indexes.values():
        for chunk in chunks:
            chunk["embedding"] = embed(chunk["text"])
    variants = list(dict.fromkeys(text for q in corpus["queries"] for text in [q["text"], q["rewritten"], *q["subqueries"], q["hyde"]]))
    query_vectors = {text: embed(text) for text in variants}
    all_chunks = [c for chunks in indexes.values() for c in chunks]
    scores = {}
    for query in corpus["queries"]:
        scores[query["text"]] = {}
        for chunk in all_chunks:
            logits, _ = infer(rerank_tokenizer, reranker, query["text"], chunk["text"], limit=512)
            assert logits.shape == (1, 1)
            scores[query["text"]][chunk["id"]] = round(float(logits[0, 0]), 7)
        print(f'Recorded reranker pairs for {query["id"]}: {len(all_chunks)}', flush=True)

    inputs = {"chunks": [{"id": c["id"], "text": c["text"]} for c in all_chunks], "queryVariants": variants}
    data = {**corpus, "indexes": indexes, "queryEmbeddings": query_vectors, "rerankerScores": scores,
            "metadata": {
                "encoder": {"model": "sentence-transformers/all-MiniLM-L6-v2", "revision": "onnx-sha256:" + ENCODER_HASHES["model.onnx"],
                            "artifactSource": "https://chroma-onnx-models.s3.amazonaws.com/all-MiniLM-L6-v2/onnx.tar.gz", "artifactSha256": ENCODER_HASHES,
                            "dimensions": 384, "maximumTokens": 256, "pooling": "attention-mask mean followed by L2 normalization"},
                "reranker": {"model": "cross-encoder/ms-marco-MiniLM-L6-v2", "revision": RERANKER_REVISION,
                             "artifactSource": f"https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2/tree/{RERANKER_REVISION}",
                             "artifactSha256": RERANKER_HASHES, "maximumTokens": 512, "output": "raw query/passage relevance logit; not a probability"},
                "corpusSha256": sha256(corpus_path.read_bytes()), "inputsSha256": sha256(canonical(inputs).encode()),
                "packages": {"python": platform.python_version(), **{name: importlib.metadata.version(name) for name in ("numpy", "onnxruntime", "tokenizers")}},
                "semanticThreshold": SEMANTIC_THRESHOLD,
                "generation": "CPU ONNX inference; authored query variants and source-backed teaching graphs; deterministic for pinned artifacts and packages",
            }}
    result = '// Generated by scripts/generate_advanced_rag_data.py; do not hand-edit.\nimport type { AdvancedDataset } from "./types";\n\nexport const ADV_DATA: AdvancedDataset = ' + canonical(data) + ';\n'
    path = root / "src/lib/advancedRag/generatedData.ts"
    if args.check:
        assert path.read_text() == result, "Regeneration differs from the committed model fixture"
        print("Byte-identical regeneration verified.")
    else:
        path.write_text(result)
        print(f"Generated {len(all_chunks)} chunks, {len(variants)} query vectors, {len(all_chunks) * len(corpus['queries'])} real reranker logits; {len(result.encode()):,} bytes")


if __name__ == "__main__":
    main()
