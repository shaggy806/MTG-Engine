/**
 * The scenario builder's "Manual checks" list (`client/src/builder/
 * manualChecks.ts`): every preset builds — its cards are real pool cards,
 * in zones they can be in — and every entry of docs/manual-checks.md has a
 * preset, named by its exact heading, so the list keeps up with the doc.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildScenario } from "../builder.js";
import { MANUAL_CHECK_PRESETS } from "../../../client/src/builder/manualChecks.ts";

const DOC = new URL("../../../docs/manual-checks.md", import.meta.url);

/** Every `###` heading after the index. */
function entryHeadings(): string[] {
  return readFileSync(DOC, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.startsWith("### "))
    .map((line) => line.slice(4).trim());
}

describe("the manual-check presets", () => {
  it("each builds", () => {
    const failures: string[] = [];
    for (const preset of MANUAL_CHECK_PRESETS) {
      try {
        buildScenario(preset.spec);
      } catch (err) {
        failures.push(`${preset.title}${preset.variant ? ` [${preset.variant}]` : ""}: ${String(err)}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it("names a real entry, and every entry has one", () => {
    const headings = entryHeadings();
    const titles = new Set(MANUAL_CHECK_PRESETS.map((p) => p.title));
    expect([...titles].filter((t) => !headings.includes(t))).toEqual([]);
    expect(headings.filter((h) => !titles.has(h))).toEqual([]);
  });

  it("gives each board of one entry a different variant name", () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const p of MANUAL_CHECK_PRESETS) {
      const id = `${p.title} / ${p.variant ?? ""}`;
      if (seen.has(id)) dupes.push(id);
      seen.add(id);
    }
    expect(dupes).toEqual([]);
  });
});
