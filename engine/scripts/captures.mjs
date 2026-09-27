// The positions saved from live games (`captures/` at the repo root,
// git-ignored — see `src/bot/capture.ts`), as training scenarios, for
// `check-scenarios.mjs` and `fit-scenarios.mjs`. None there, none added.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { scenarioFromCapture } from "../dist/index.js";

export const CAPTURE_DIR = fileURLToPath(new URL("../../captures/", import.meta.url));

export function loadCaptureScenarios() {
  if (!existsSync(CAPTURE_DIR)) return [];
  return readdirSync(CAPTURE_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => scenarioFromCapture(JSON.parse(readFileSync(CAPTURE_DIR + file, "utf8"))));
}
