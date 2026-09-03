import { describe, expect, it } from "vitest";

import { createRng, shuffle } from "./primitives.js";

describe("createRng", () => {
  it("produces a repeatable sequence for a given seed", () => {
    const a = createRng(123);
    const b = createRng(123);
    const seqA = Array.from({ length: 8 }, () => a.next());
    const seqB = Array.from({ length: 8 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("stays within [0, 1)", () => {
    const rng = createRng(999);
    for (let i = 0; i < 1000; i += 1) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("resumes an identical stream from its reported seed", () => {
    const original = createRng(42);
    original.next();
    original.next();
    const resumed = createRng(original.seed);
    expect(resumed.next()).toBe(original.next());
  });

  it("int() returns values in range", () => {
    const rng = createRng(7);
    for (let i = 0; i < 500; i += 1) {
      const value = rng.int(6);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(6);
    }
  });
});

describe("shuffle", () => {
  it("is a permutation of the input", () => {
    const items = Array.from({ length: 40 }, (_, i) => i);
    const out = shuffle(items, createRng(1));
    expect(out).toHaveLength(items.length);
    expect([...out].sort((x, y) => x - y)).toEqual(items);
  });

  it("does not mutate the input and is seed-deterministic", () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    const a = shuffle(items, createRng(5));
    const b = shuffle(items, createRng(5));
    expect(items).toEqual(Array.from({ length: 20 }, (_, i) => i));
    expect(a).toEqual(b);
    expect(a).not.toEqual(items);
  });
});
