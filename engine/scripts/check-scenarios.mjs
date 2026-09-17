// Run the opponent-independent scenarios (`src/bot/scenarios.ts`) against a
// weight vector, and exit non-zero if any fails.
//
//   npm run bot:scenarios -w engine
//   npm run bot:scenarios -w engine -- --weights-file data/fitted.json
//   npm run bot:scenarios -w engine -- --champion aggressive
//   npm run bot:scenarios -w engine -- --weights '{"life":4}'
//
// This is the gate a candidate vector has to pass before it ships, and the one
// measurement that can't be gamed by exploiting whatever the benchmark
// opponents happen to be bad at. A fitted vector that benches beautifully and
// fails a scenario is rejected.

import { readFileSync } from "node:fs";

import { DEFAULT_WEIGHTS, championById, createDefaultRegistry, runScenarios } from "../dist/index.js";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};

const champion = flag("champion", null);
const weightsFile = flag("weights-file", null);
const base = champion !== null ? championById(champion).weights : DEFAULT_WEIGHTS;
const fromFile = weightsFile !== null ? JSON.parse(readFileSync(weightsFile, "utf8")) : {};
const weights = { ...base, ...fromFile, ...JSON.parse(flag("weights", "{}")) };
for (const key of Object.keys(weights)) {
  if (!(key in DEFAULT_WEIGHTS)) throw new Error(`unknown weight "${key}"`);
}

const label = champion ?? weightsFile ?? "current defaults";
console.log(`scenarios: ${label}`);

const reports = runScenarios(weights, createDefaultRegistry());
for (const r of reports) {
  console.log(`  ${r.passed ? "PASS" : "FAIL"}  ${r.name.padEnd(36)} ${r.passed ? "" : `(${r.detail})`}`);
  if (!r.passed) console.log(`        rule: ${r.rule}`);
}

const failed = reports.filter((r) => !r.passed);
console.log(`${reports.length - failed.length}/${reports.length} passed`);
process.exit(failed.length > 0 ? 1 : 0);
