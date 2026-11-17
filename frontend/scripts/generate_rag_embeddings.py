"""Generate the lesson's real MiniLM vectors once; frontend builds never run this.

Use the original Chroma ONNX export of sentence-transformers/all-MiniLM-L6-v2:
https://chroma-onnx-models.s3.amazonaws.com/all-MiniLM-L6-v2/onnx.tar.gz
The SHA256 fingerprints below pin the actual artifacts, not a Hugging Face git revision.
Install generation-only dependencies in a separate environment:
    pip install numpy==2.5.5 onnxruntime==1.32.0 tokenizers==0.23.3
Run: python scripts/generate_rag_embeddings.py --model-dir /path/to/onnx
Output is deterministic for the same model, corpus, and package versions.

Pooling follows the model card's masked mean, then L2 normalization:
https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2
"""

import argparse
import hashlib
import importlib.metadata
import json
import platform
from pathlib import Path


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def chunks_for(documents, size, overlap):
    chunks = []
    for doc in documents:
        for start in range(0, len(doc["sentences"]), size - overlap):
            sentences = doc["sentences"][start : start + size]
            chunks.append({
                "id": f'{doc["id"]}-{size}-{overlap}-{start}',
                "documentId": doc["id"], "source": doc["title"],
                "sentenceIds": [s["id"] for s in sentences],
                "text": " ".join(s["text"] for s in sentences),
            })
            if start + size >= len(doc["sentences"]):
                break
    return chunks


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model-dir", type=Path, required=True)
    args = parser.parse_args()
    import numpy as np
    import onnxruntime as ort
    from tokenizers import Tokenizer

    root = Path(__file__).resolve().parent.parent
    corpus_path = root / "scripts/fixtures/rag-corpus.json"
    corpus = json.loads(corpus_path.read_text())
    model_dir = args.model_dir
    for filename, expected in PINNED_ARTIFACTS.items():
        actual = sha256(model_dir / filename)
        if actual != expected:
            raise ValueError(f"{filename}: artifact fingerprint differs from the recorded ONNX revision")
    tokenizer = Tokenizer.from_file(str(model_dir / "tokenizer.json"))
    tokenizer.enable_truncation(max_length=256)
    tokenizer.enable_padding(pad_id=0, pad_token="[PAD]")
    options = ort.SessionOptions()
    options.intra_op_num_threads = 1
    options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(model_dir / "model.onnx"), sess_options=options, providers=["CPUExecutionProvider"])

    def encode(text, trace=False):
        tokenized = tokenizer.encode(text)
        if len(tokenized.ids) >= 256:
            raise ValueError("Teaching inputs must fit without truncation")
        inputs = {
            "input_ids": np.array([tokenized.ids], dtype=np.int64),
            "attention_mask": np.array([tokenized.attention_mask], dtype=np.int64),
            "token_type_ids": np.array([tokenized.type_ids], dtype=np.int64),
        }
        output = session.run(None, {node.name: inputs[node.name] for node in session.get_inputs()})[0][0]
        mask = np.array(tokenized.attention_mask, dtype=np.float32)
        pooled = (output * mask[:, None]).sum(axis=0) / mask.sum()
        norm = np.linalg.norm(pooled)
        embedding = pooled / norm
        assert embedding.shape == (384,) and np.isfinite(embedding).all()
        vector = [round(float(v), 9) for v in embedding]
        if not trace:
            return vector
        return {
            "text": text,
            "tokens": [{"token": token, "id": token_id, "mask": int(mask[i]),
                        "components": [round(float(v), 9) for v in output[i, :4]]}
                       for i, (token, token_id) in enumerate(zip(tokenized.tokens, tokenized.ids))],
            "componentIndices": [0, 1, 2, 3],
            "pooledComponents": [round(float(v), 9) for v in pooled[:4]],
            "pooledNorm": round(float(norm), 9),
            "normalizedComponents": vector[:4], "embedding": vector,
        }

    configurations = []
    for size in [2, 3, 4]:
        for overlap in [0, 1]:
            chunks = chunks_for(corpus["documents"], size, overlap)
            for chunk in chunks:
                chunk["embedding"] = encode(chunk["text"])
            configurations.append({"chunkSize": size, "overlap": overlap, "chunks": chunks})
    data = {
        "metadata": {
            "model": "sentence-transformers/all-MiniLM-L6-v2", "dimensions": 384,
            "revision": f'onnx-sha256:{PINNED_ARTIFACTS["model.onnx"]}',
            "artifactSha256": PINNED_ARTIFACTS,
            "artifactSource": "https://chroma-onnx-models.s3.amazonaws.com/all-MiniLM-L6-v2/onnx.tar.gz",
            "corpusSha256": sha256(corpus_path),
            "pooling": "attention-mask mean pooling, including non-padding special tokens",
            "normalization": "L2", "maximumTokens": 256, "python": platform.python_version(),
            "packages": {name: importlib.metadata.version(name) for name in ["numpy", "onnxruntime", "tokenizers"]},
        },
        **corpus,
        "configurations": configurations,
        "queryEmbeddings": {q["id"]: encode(q["text"]) for q in corpus["queries"]},
        "trace": encode(corpus["documents"][0]["sentences"][0]["text"], trace=True),
    }
    output = root / "src/lib/ml/ragData.ts"
    output.write_text('// Generated by scripts/generate_rag_embeddings.py; do not hand-edit.\n'
                      'import type { RagDataset } from "./rag";\n\n'
                      'export const RAG_DATA: RagDataset = ' + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ';\n')
    print(f"Generated {len(configurations)} configurations, {sum(len(c['chunks']) for c in configurations)} chunks, {len(corpus['queries'])} queries; {output.stat().st_size:,} bytes")


# Filled from the public Chroma all-MiniLM-L6-v2 ONNX artifact.
PINNED_ARTIFACTS = {
    "model.onnx": "4f148ba8ae9c2c7fbee4af2b132db8d06c6a6545b47fc83bbb98c3d22b8393e6",
    "tokenizer.json": "da0e79933b9ed51798a3ae27893d3c5fa4a201126cef75586296df9b4d2c62a0",
    "config.json": "b567c7d5a55b636c95186aaf993f9a8920842b7e05a9e703e68b23cab2c3a670"
}

if __name__ == "__main__":
    main()
