// What would the weights have to be for v2 to answer the scenarios right?
//
//   npm run bot:fit-scenarios -w engine
//   npm run bot:fit-scenarios -w engine -- --free otherOpponents,handManaValue
//   npm run bot:fit-scenarios -w engine -- --out hand.json --joint
//
// Records every scenario that is a position (`src/bot/scenario-fit.ts`) under
// the base vector — the shipped defaults, or --champion, plus --weights — and
// then, for each scenario it gets wrong, lists the levers: every single weight
// that would get it right on its own, the nearest value that does, and what
// that change alone would break. A scenario with no lever needs a feature.
//
// Then it tunes by hand, automated: the cheapest lever that breaks nothing,
// one wrong scenario at a time, each found against the vector as it stands.
// Each scenario's margin (its best right answer's score less its best wrong
// one's) is shown before and after, and every scenario is then played for
// real under the tuned vector, combat scripts included — a decision's replay
// is close rather than exact, and only a real run is proof. --joint adds a
// coordinate-descent fit of every free weight at once, which can trade margins
// between scenarios; on a small corpus it trades weights the four-player
// sweeps set for margins nothing needs, so the hand-tuned vector is the one
// to bench: `bot:bench -- --weights "$(cat hand.json)"`.
//
// Flags: --champion ID, --weights JSON (base overrides), --free a,b,c (the
// weights it may move; default all but FIT_FIXED), --fix a,b (hold these too),
// --out PATH (the hand-tuned vector), --joint, and for it --margin POINTS (0.5,
// what a training scenario must win by), --gate-margin POINTS (0.1), --lambda
// COST (0.5), --gate-cost N (10), --out-joint PATH.

import { writeFileSync } from "node:fs";

import {
  BOT_SCENARIOS,
  DEFAULT_WEIGHTS,
  EvalBotController,
  FIT_FIXED,
  FIT_TIED,
  TRAINING_SCENARIOS,
  championById,
  createDefaultRegistry,
  fitWeights,
  handTune,
  leversFor,
  recordScenario,
  replayChoice,
  replayRight,
  runScenarios,
  scenarioMargin,
} from "../dist/index.js";
import { loadCaptureScenarios, loadResolvedCaptureScenarios } from "./captures.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const list = (value) => (value === null ? null : value.split(",").map((s) => s.trim()).filter(Boolean));

const champion = flag("champion", null);
const base = {
  ...(champion !== null ? championById(champion).weights : DEFAULT_WEIGHTS),
  ...JSON.parse(flag("weights", "{}")),
};
const known = Object.keys(DEFAULT_WEIGHTS);
const check = (keys, what) => {
  for (const key of keys) if (!known.includes(key)) throw new Error(`${what}: unknown weight "${key}"`);
};
check(Object.keys(base), "--weights");
const fixed = new Set([...FIT_FIXED, ...(list(flag("fix", null)) ?? [])]);
const free = list(flag("free", null)) ?? known.filter((key) => !fixed.has(key));
check(free, "--free");
const options = {
  base,
  free,
  margin: Number(flag("margin", "0.5")),
  gateMargin: Number(flag("gate-margin", "0.1")),
  lambda: Number(flag("lambda", "0.5")),
  gateCost: Number(flag("gate-cost", "10")),
  tied: FIT_TIED.filter(([follower]) => !free.includes(follower)),
};
const out = flag("out", null);

const registry = createDefaultRegistry();
// Positions captured from live games are training scenarios too
// (`captures/`, git-ignored), and resolved ones gate (`captures/resolved/`).
const scenarios = [
  ...BOT_SCENARIOS,
  ...loadResolvedCaptureScenarios(),
  ...TRAINING_SCENARIOS,
  ...loadCaptureScenarios(),
];
console.log(
  `bot:fit-scenarios — base ${champion ?? "current defaults"}; margin ${options.margin}, ` +
    `lambda ${options.lambda}, gate x${options.gateCost}; ${free.length} free weights`,
);

// --- record ------------------------------------------------------------------
const records = [];
const scripts = [];
const broken = [];
for (const scenario of scenarios) {
  const started = Date.now();
  const record = recordScenario(scenario, registry, base);
  if (record === null) scripts.push(scenario.name);
  else if (!("answers" in record)) broken.push(`${scenario.name}: ${record.detail}`);
  else {
    records.push(record);
    // The replay has to reproduce what the bot actually did, or every number
    // below is about some other bot.
    if (record.answers.length > 0) {
      const replayed = record.answers[replayChoice(record, base)].action;
      if (JSON.stringify(replayed) !== JSON.stringify(record.chosen)) {
        console.log(`  ! replay disagrees with the bot on "${record.name}"${record.exact ? "" : " (a decision)"}`);
      }
    }
  }
  process.stderr.write(`  recorded ${scenario.name} (${Date.now() - started} ms)\n`);
}
const searched = records.filter((r) => r.answers.length > 0).length;
console.log(
  `recorded ${records.length} positions (${searched} searched, ${records.length - searched} answered ` +
    `without a search); ${scripts.length} combat scripts run whole only`,
);
for (const line of broken) console.log(`  setup failed: ${line}`);

// --- levers: what one weight alone would take ----------------------------------
const wrongAtBase = records.filter((r) => !replayRight(r, base));
if (wrongAtBase.length > 0) console.log("\nwhat one weight alone would take (the change, its margin, what it breaks):");
for (const record of wrongAtBase) {
  const levers = leversFor(record, records, base, free, options.tied);
  console.log(`  ${record.name}`);
  if (levers.length === 0) console.log("    no single weight — a feature, or a search limit, not a weight");
  for (const lever of levers.slice(0, 6)) {
    console.log(
      `    ${lever.key.padEnd(20)} ${String(base[lever.key]).padStart(5)} -> ${String(lever.value).padEnd(6)}` +
        ` margin ${lever.margin.toFixed(2).padStart(6)}   ${lever.breaks.length === 0 ? "breaks nothing" : `breaks ${lever.breaks.join("; ")}`}`,
    );
  }
}

// --- moving the weights ---------------------------------------------------------
// By hand: the cheapest lever that breaks nothing, one wrong scenario at a
// time, each found against the vector as it stands. With --joint, also
// coordinate descent over every free weight at once, which can trade one
// scenario's margin for another's — and on a small corpus does, moving weights
// the four-player sweeps set (`power`) for margins the scenarios don't need.
const hand = handTune(records, base, free, options.tied);
const joint = args.includes("--joint") ? fitWeights(records, options) : null;

const fmt = (m) => (m === Infinity ? "     —" : m === -Infinity ? "  none" : m.toFixed(2).padStart(6));
const mark = (record, w) => `${fmt(scenarioMargin(record, w))} ${replayRight(record, w) ? "right" : "WRONG"}`;
const width = Math.max(...records.map((r) => r.name.length));
console.log(
  `\n${"".padEnd(11)}${"scenario".padEnd(width)}  ${"base".padEnd(12)}  ${"by hand".padEnd(12)}${joint ? "  joint fit" : ""}`,
);
for (const kind of ["gate", "training"]) {
  for (const record of records.filter((r) => r.kind === kind)) {
    console.log(
      `  ${kind.padEnd(8)} ${record.name.padEnd(width)}  ${mark(record, base)}  ${mark(record, hand.weights)}` +
        `${joint ? `  ${mark(record, joint.weights)}` : ""}${record.exact ? "" : "  (decision)"}`,
    );
  }
}

const movedIn = (w) => known.filter((key) => w[key] !== base[key]);
console.log("\nby hand, one lever at a time:");
if (hand.pulled.length === 0) console.log("  nothing to pull");
for (const { scenario, key, from, value } of hand.pulled) {
  console.log(`  ${key.padEnd(20)} ${String(from).padStart(6)} -> ${String(value).padEnd(6)} for "${scenario}"`);
}
for (const name of hand.unfixed) console.log(`  still wrong, no clean lever: "${name}"`);
if (joint !== null) {
  console.log(`\njointly (loss ${joint.baseLoss.toFixed(2)} -> ${joint.loss.toFixed(2)}, ${joint.sweeps} sweeps):`);
  if (movedIn(joint.weights).length === 0) console.log("  nothing moved");
  for (const key of movedIn(joint.weights)) {
    console.log(`  ${key.padEnd(20)} ${String(base[key]).padStart(6)} -> ${joint.weights[key]}`);
  }
}
for (const record of records.filter((r) => scenarioMargin(r, base) === -Infinity)) {
  console.log(`  "${record.name}": no right answer was ever simulated — a search limit, not a weight`);
}

// --- the proof: every scenario played for real -------------------------------
const makeBot = (player, reg, w) => new EvalBotController(player, reg, { weights: w });
const vectors = [["by hand", hand.weights], ...(joint ? [["joint fit", joint.weights]] : [])];
for (const [label, w] of vectors) {
  if (movedIn(w).length === 0) continue;
  console.log(`\n${label}, played for real:`);
  const reports = runScenarios(w, registry, makeBot, scenarios);
  for (const kind of ["gate", "training"]) {
    const mine = reports.filter((r) => r.kind === kind);
    const failed = mine.filter((r) => !r.passed);
    console.log(`  ${kind}: ${mine.length - failed.length}/${mine.length} right`);
    for (const r of failed) console.log(`    wrong: ${r.name} (${r.detail})`);
  }
  for (const record of records) {
    const real = reports.find((r) => r.name === record.name);
    if (real !== undefined && real.passed !== replayRight(record, w)) {
      console.log(`  ! "${record.name}": the replay said ${real.passed ? "wrong" : "right"}, the real run disagrees`);
    }
  }
}

const outJoint = flag("out-joint", null);
if (out !== null) {
  writeFileSync(out, JSON.stringify(hand.weights, null, 2));
  console.log(`\nwrote the hand-tuned vector to ${out}`);
}
if (outJoint !== null && joint !== null) {
  writeFileSync(outJoint, JSON.stringify(joint.weights, null, 2));
  console.log(`wrote the joint fit to ${outJoint}`);
}
