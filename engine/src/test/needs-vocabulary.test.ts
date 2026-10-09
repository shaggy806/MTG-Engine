/**
 * The triage records' need vocabulary (`data/needs-vocabulary.json`, read by
 * `scripts/needs-vocabulary.mjs`): every need a record names must resolve to
 * a feature, so `cards:needs` can rank them and `card:brief` can say when one
 * has been built since. A new record that invents a key fails here — use a
 * feature's key, or add the new one to the vocabulary's `features` (with its
 * `family`) in the same commit.
 */
import { describe, expect, it } from "vitest";

import { loadRecords, loadVocabulary } from "../../scripts/needs-vocabulary.mjs";

describe("the need vocabulary", () => {
  const vocab = loadVocabulary();

  it("knows every need every triage record names", () => {
    const unknown = loadRecords().flatMap((r: { name: string; needs: string[] }) =>
      r.needs.filter((raw) => vocab.canonical(raw) === undefined).map((raw) => `${r.name}: ${raw}`),
    );
    expect(unknown).toEqual([]);
  });

  it("aliases only onto features, and files features only under real families", () => {
    const known = (key: string): boolean => vocab.features.has(key) || vocab.isMeta(key);
    const badAliases = [...vocab.aliases].filter(([, to]) => !known(to)).map(([from, to]) => `${from} → ${to}`);
    const badFamilies = [...vocab.features]
      .filter(([, f]) => f.family !== undefined && !vocab.features.has(f.family))
      .map(([key, f]) => `${key} in ${f.family}`);
    expect([...badAliases, ...badFamilies]).toEqual([]);
  });

  it("marks only real features built", () => {
    expect([...vocab.built].filter((key) => !vocab.features.has(key))).toEqual([]);
  });
});
