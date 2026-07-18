import { describe, expect, it } from "vitest";
import {
  chunkDocument,
  cosineSimilarity,
  InMemoryVectorStore,
  type KnowledgeDocument,
} from "@/lib/knowledge/rag";

function doc(content: string): KnowledgeDocument {
  return { id: "d1", title: "Test Doc", source: "unit-test", content, grade: "primary" };
}

describe("chunkDocument", () => {
  it("returns no chunks for empty content", () => {
    expect(chunkDocument(doc("   "))).toHaveLength(0);
  });

  it("returns a single chunk for short content", () => {
    const chunks = chunkDocument(doc("A short document."));
    expect(chunks).toHaveLength(1);
    expect(chunks[0].index).toBe(0);
    expect(chunks[0].grade).toBe("primary");
  });

  it("splits long content into overlapping chunks that cover everything", () => {
    const sentence = "This is a sentence about career intelligence and quiet operators. ";
    const content = sentence.repeat(80); // ~5300 chars
    const chunks = chunkDocument(doc(content), { maxChars: 1000, overlapChars: 150 });
    expect(chunks.length).toBeGreaterThan(3);
    // Indices are sequential
    chunks.forEach((c, i) => expect(c.index).toBe(i));
    // No chunk exceeds the max size
    chunks.forEach((c) => expect(c.text.length).toBeLessThanOrEqual(1000));
  });

  it("covers the full source with no skipped regions", () => {
    // Every non-whitespace character of the source must appear in some chunk;
    // chunks are contiguous with overlap, so removing spaces and concatenating
    // the deduped forward progress must reconstruct the whole document.
    const content = Array.from({ length: 120 }, (_, i) => `Sentence number ${i} here.`).join(" ");
    const chunks = chunkDocument(doc(content), { maxChars: 400, overlapChars: 80 });
    // Reconstruct by walking chunks and appending only the newly-advanced tail.
    let reconstructed = chunks[0].text;
    for (let i = 1; i < chunks.length; i++) {
      const prev = chunks[i - 1].text;
      const cur = chunks[i].text;
      // Find the overlap between the end of prev and the start of cur.
      let overlap = 0;
      const max = Math.min(prev.length, cur.length);
      for (let k = max; k > 0; k--) {
        if (prev.slice(prev.length - k) === cur.slice(0, k)) {
          overlap = k;
          break;
        }
      }
      reconstructed += cur.slice(overlap);
    }
    const norm = (s: string) => s.replace(/\s+/g, "");
    expect(norm(reconstructed)).toBe(norm(content.trim()));
  });

  it("adjacent chunks share overlapping boundary text", () => {
    const content = "word ".repeat(500).trim();
    const chunks = chunkDocument(doc(content), { maxChars: 300, overlapChars: 100 });
    expect(chunks.length).toBeGreaterThan(2);
    for (let i = 1; i < chunks.length; i++) {
      const prevTail = chunks[i - 1].text.slice(-20);
      // Some suffix of the previous chunk reappears at the start of this one.
      expect(chunks[i].text.includes(prevTail.trim().split(" ")[0])).toBe(true);
    }
  });

  it("rejects invalid window options", () => {
    expect(() => chunkDocument(doc("x"), { maxChars: 0 })).toThrow(RangeError);
    expect(() => chunkDocument(doc("x"), { maxChars: -10 })).toThrow(RangeError);
    expect(() => chunkDocument(doc("x"), { overlapChars: -1 })).toThrow(RangeError);
    // overlap must be strictly less than maxChars, else progress stalls.
    expect(() => chunkDocument(doc("x"), { maxChars: 100, overlapChars: 100 })).toThrow(RangeError);
    expect(() => chunkDocument(doc("x"), { maxChars: 100, overlapChars: 150 })).toThrow(RangeError);
    expect(() => chunkDocument(doc("x"), { maxChars: 10.5 })).toThrow(RangeError);
  });
});

describe("cosineSimilarity", () => {
  it("is 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });
  it("is 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });
  it("is 0 for zero vectors", () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
  it("rejects mismatched dimensions instead of truncating", () => {
    expect(() => cosineSimilarity([1, 2, 3], [1, 2])).toThrow(RangeError);
  });
});

describe("InMemoryVectorStore", () => {
  it("returns nearest chunks by cosine similarity", async () => {
    const store = new InMemoryVectorStore();
    const base = { documentId: "d1", documentTitle: "T", source: "s", grade: "primary" as const };
    await store.upsert(
      [
        { ...base, index: 0, text: "about cats" },
        { ...base, index: 1, text: "about dogs" },
      ],
      [
        [1, 0, 0],
        [0, 1, 0],
      ]
    );
    const results = await store.query([0.9, 0.1, 0], 1);
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe("about cats");
    expect(results[0].score).toBeGreaterThan(0.9);
  });

  it("upsert replaces existing chunks by (documentId, index)", async () => {
    const store = new InMemoryVectorStore();
    const base = { documentId: "d1", documentTitle: "T", source: "s", grade: "primary" as const };
    await store.upsert([{ ...base, index: 0, text: "v1" }], [[1, 0]]);
    await store.upsert([{ ...base, index: 0, text: "v2" }], [[1, 0]]);
    const results = await store.query([1, 0], 10);
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe("v2");
  });

  it("rejects a chunk/embedding count mismatch without mutating", async () => {
    const store = new InMemoryVectorStore();
    const base = { documentId: "d1", documentTitle: "T", source: "s", grade: "primary" as const };
    await expect(
      store.upsert([{ ...base, index: 0, text: "a" }], [[1, 0], [0, 1]])
    ).rejects.toThrow(RangeError);
    expect(await store.query([1, 0], 10)).toHaveLength(0);
  });

  it("rejects an inconsistent embedding dimension", async () => {
    const store = new InMemoryVectorStore();
    const base = { documentId: "d1", documentTitle: "T", source: "s", grade: "primary" as const };
    await store.upsert([{ ...base, index: 0, text: "a" }], [[1, 0]]);
    await expect(
      store.upsert([{ ...base, index: 1, text: "b" }], [[1, 0, 0]])
    ).rejects.toThrow(RangeError);
  });
});
