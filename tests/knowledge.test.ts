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
});
