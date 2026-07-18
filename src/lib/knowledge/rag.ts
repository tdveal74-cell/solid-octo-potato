/**
 * Knowledge Engine — retrieval-augmented generation core.
 *
 * Storage is pluggable: `VectorStore` is the seam. Production uses Supabase
 * pgvector (see src/lib/db/schema.sql → knowledge_chunks + match_chunks());
 * tests and local dev use the in-memory store below. Embeddings are likewise
 * pluggable via `Embedder` — wire any embedding provider without touching
 * retrieval logic.
 */

import { getClient, MODELS } from "../ai/client";

export interface KnowledgeDocument {
  id: string;
  title: string;
  source: string;
  content: string;
  /** Source trust grade assigned at ingestion. */
  grade: "primary" | "secondary" | "unverified";
}

export interface Chunk {
  documentId: string;
  documentTitle: string;
  source: string;
  grade: KnowledgeDocument["grade"];
  index: number;
  text: string;
}

export interface RetrievedChunk extends Chunk {
  score: number;
}

export interface Embedder {
  embed(texts: string[]): Promise<number[][]>;
}

export interface VectorStore {
  upsert(chunks: Chunk[], embeddings: number[][]): Promise<void>;
  query(embedding: number[], topK: number): Promise<RetrievedChunk[]>;
}

/** Sentence-aware sliding-window chunker. */
export function chunkDocument(
  doc: KnowledgeDocument,
  { maxChars = 1600, overlapChars = 200 }: { maxChars?: number; overlapChars?: number } = {}
): Chunk[] {
  if (
    !Number.isInteger(maxChars) ||
    !Number.isInteger(overlapChars) ||
    maxChars <= 0 ||
    overlapChars < 0 ||
    overlapChars >= maxChars
  ) {
    throw new RangeError("Expected integers with 0 <= overlapChars < maxChars");
  }
  const text = doc.content.trim();
  if (!text) return [];
  const chunks: Chunk[] = [];
  let start = 0;
  let index = 0;
  while (start < text.length) {
    let end = Math.min(start + maxChars, text.length);
    if (end < text.length) {
      // Prefer to break at a sentence boundary in the back half of the window.
      const window = text.slice(start, end);
      const lastBreak = Math.max(
        window.lastIndexOf(". "),
        window.lastIndexOf(".\n"),
        window.lastIndexOf("\n\n")
      );
      if (lastBreak > maxChars / 2) end = start + lastBreak + 1;
    }
    chunks.push({
      documentId: doc.id,
      documentTitle: doc.title,
      source: doc.source,
      grade: doc.grade,
      index: index++,
      text: text.slice(start, end).trim(),
    });
    if (end >= text.length) break;
    start = Math.max(end - overlapChars, start + 1);
  }
  return chunks;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new RangeError(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** In-memory vector store for tests and local development. */
export class InMemoryVectorStore implements VectorStore {
  private rows: { chunk: Chunk; embedding: number[] }[] = [];
  private dimension: number | null = null;

  async upsert(chunks: Chunk[], embeddings: number[][]): Promise<void> {
    // Validate everything before mutating so a bad batch can't leave the
    // store partially written or holding undefined embeddings.
    if (chunks.length !== embeddings.length) {
      throw new RangeError(
        `Expected one embedding per chunk: ${chunks.length} chunks, ${embeddings.length} embeddings`
      );
    }
    const dim = this.dimension ?? embeddings[0]?.length ?? null;
    if (dim !== null && embeddings.some((e) => e.length !== dim)) {
      throw new RangeError(`All embeddings must have dimension ${dim}`);
    }
    this.dimension = dim;
    chunks.forEach((chunk, i) => {
      this.rows = this.rows.filter(
        (r) => !(r.chunk.documentId === chunk.documentId && r.chunk.index === chunk.index)
      );
      this.rows.push({ chunk, embedding: embeddings[i] });
    });
  }

  async query(embedding: number[], topK: number): Promise<RetrievedChunk[]> {
    return this.rows
      .map((r) => ({ ...r.chunk, score: cosineSimilarity(embedding, r.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

export interface RagAnswer {
  answer: string;
  citations: { title: string; source: string; grade: KnowledgeDocument["grade"] }[];
}

/**
 * Grounded answer generation. The prompt enforces the Knowledge Engine's
 * source-verification policy: unverified sources may inform but must be
 * flagged, and claims without support in the retrieved context are labeled.
 */
export async function answerWithContext(
  question: string,
  retrieved: RetrievedChunk[]
): Promise<RagAnswer> {
  const client = getClient();
  const contextBlock = retrieved
    .map(
      (c, i) =>
        `[${i + 1}] (${c.grade}) "${c.documentTitle}" — ${c.source}\n${c.text}`
    )
    .join("\n\n");

  const stream = client.messages.stream({
    model: MODELS.PRIMARY,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: `You answer questions from a curated research library. Rules: cite retrieved passages by [number]; treat passages graded "unverified" as leads, not facts, and say so when you rely on one; if the retrieved context does not support an answer, say what is missing instead of improvising.`,
    messages: [
      {
        role: "user",
        content: `RETRIEVED CONTEXT:\n${contextBlock || "(nothing retrieved)"}\n\nQUESTION:\n${question}`,
      },
    ],
  });
  const message = await stream.finalMessage();
  const answer = message.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Only surface documents the answer actually cites ([n] markers), so the
  // citation list never overstates support. The system prompt requires
  // citation-by-number, making the markers deterministic to extract.
  const referenced = new Set<number>();
  for (const match of answer.matchAll(/\[(\d+)\]/g)) {
    const idx = Number(match[1]) - 1;
    if (idx >= 0 && idx < retrieved.length) referenced.add(idx);
  }
  const seen = new Set<string>();
  const citations = [...referenced]
    .sort((a, b) => a - b)
    .map((i) => retrieved[i])
    .filter((c) => (seen.has(c.documentId) ? false : (seen.add(c.documentId), true)))
    .map((c) => ({ title: c.documentTitle, source: c.source, grade: c.grade }));

  return { answer, citations };
}
