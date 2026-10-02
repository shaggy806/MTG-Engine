// The positions saved from live games (`captures/` at the repo root,
// git-ignored — see `src/bot/capture.ts`), as scenarios for
// `check-scenarios.mjs` and `fit-scenarios.mjs`. None there, none added.
//
// `captures/*.json` are open: training scenarios, right answers the bot may
// still get wrong. `captures/resolved/*.json` are ones it now gets right,
// each with a `resolved` record (`npm run bot:captures -- resolve`): gate
// scenarios, so a fixed blunder that comes back fails the gate.
// `captures/bugs/` holds bug reports, not scenarios, and isn't read here.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { scenarioFromCapture } from "../dist/index.js";

export const CAPTURE_DIR = fileURLToPath(new URL("../../captures/", import.meta.url));
export const RESOLVED_DIR = fileURLToPath(new URL("../../captures/resolved/", import.meta.url));

/** The capture files in `dir`, oldest first, as `{ file, path, capture }`. */
export function readCaptures(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => ({ file, path: dir + file, capture: JSON.parse(readFileSync(dir + file, "utf8")) }));
}

/** Open captures, as training scenarios. */
export function loadCaptureScenarios() {
  return readCaptures(CAPTURE_DIR).map(({ capture }) => scenarioFromCapture(capture));
}

/** Resolved captures, as gate scenarios. */
export function loadResolvedCaptureScenarios() {
  return readCaptures(RESOLVED_DIR).map(({ capture }) =>
    scenarioFromCapture(capture.resolved === undefined ? { ...capture, resolved: { at: "", commit: "", note: "" } } : capture),
  );
}
