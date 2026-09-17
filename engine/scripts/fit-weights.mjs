// Fit the evaluation's weights by logistic regression over harvested
// self-play positions.
//
//   npm run bot:harvest -w engine -- --games 2000 --out data/positions.ndjson
//   npm run bot:fit     -w engine -- --in data/positions.ndjson
//
// Flags: --in PATH (NDJSON from `harvest-positions.mjs`), --l2 LAMBDA (default
// 1e-4, on standardized coefficients), --epochs N (default 200), --lr RATE
// (Adam step on standardized coefficients, default 0.05), --holdout FRACTION
// (games held out to report accuracy on, default 0.2), --out PATH (writes the
// fitted `EvalWeights` as JSON, ready for `bot:bench --weights`),
// --allow-negative (lift the non-negativity constraint — see below).
//
// ## The model
//
// `P(this seat wins) = sigmoid(w . x)`, where `x` is the sign-folded difference
// vector `evaluateState` already computes — so `w` *is* an `EvalWeights`, in
// log-odds-per-unit-of-feature, and needs no translation to be used.
//
// **No intercept.** At two players the rows come in symmetric pairs (both
// seats of the same position, labelled 1 and 0), so an even position has to
// score 0. An intercept would be fitted to zero anyway, and leaving it out
// makes that a property of the model rather than a coincidence of the data.
//
// **Standardized, not centered.** Each column is divided by its own standard
// deviation before fitting, because the raw features differ by two orders of
// magnitude (`library` is around 90, `monarch` is 0 or 1) and one L2 penalty
// across all of them would otherwise mean wildly different things per column.
// They're deliberately *not* centered: centering without an intercept changes
// the model, and the pairing already puts every column's mean near zero.
// Coefficients are divided back through by the same scale at the end.
//
// **One weight per game, not per row.** A 60-turn grind contributes three
// times the rows of a 20-turn game, and nothing about it is three times as
// informative — the positions inside one game are near-duplicates of each
// other. Each game's rows are therefore down-weighted by that game's length,
// so every *game* carries the same total weight.
//
// ## Why the coefficients are constrained non-negative
//
// This is the one place where the data has to be overruled, and the first
// unconstrained run on 1600 games is the argument. It reported, with a
// perfectly respectable 70% holdout accuracy:
//
//   extraLands  -4.64    library  -2.14    commanderTax  +9.36 (a subtracted term)
//
// Every one of those is *true* as a statement about positions and *wrong* as a
// statement about actions. A player sitting on twelve lands is usually one
// whose game went long because they were losing; a big library is cards you
// haven't got to draw yet; a commander recast four times is a commander that
// has died four times. None of it means playing a land, keeping your library or
// recasting your commander is bad — but a weight is applied to exactly those
// choices. At `extraLands -4.64` against `hand +2.51`, a land drop past the cap
// scores -7.15 and the bot stops making land drops altogether, which is the
// catatonic failure this whole design was built to avoid, arriving by a new
// route.
//
// A one-ply search compares *sibling* states from one decision point, where the
// "how far along, and how badly" part of a feature is nearly identical across
// siblings and cancels. What does not cancel is the part the action itself
// moves — and that is precisely the causal direction the regression cannot see
// and the `EvalWeights` sign convention already encodes. So the constraint is
// applied as projected gradient (clamped after each step, so the remaining
// coefficients adapt around it rather than being truncated at the end), and any
// feature that ends pinned at zero is reported: the data wanted it negative and
// was refused, which is worth knowing.
//
// `--allow-negative` lifts it, for looking at what the data actually says.
//
// ## What is and isn't fitted
//
// Only the terms the score is linear in (`FEATURE_KEYS`). `landCap` is a
// threshold inside a feature, `opponent`/`otherOpponents` are how a bigger
// table is aggregated, and `crackbackParanoia`/`crackbackMargin` are combat
// knobs — none is a coefficient, so all five are carried through from the
// starting vector untouched and stay the (1+1)-ES's job.
//
// See `docs/plans/smarter-bots.md`, "Fitting the weights from self-play".

import { readFileSync, writeFileSync } from "node:fs";

import { DEFAULT_WEIGHTS, FEATURE_KEYS } from "../dist/index.js";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};

const input = flag("in", "data/positions.ndjson");
const l2 = Number(flag("l2", "1e-4"));
const epochs = Number(flag("epochs", "200"));
const lr = Number(flag("lr", "0.05"));
const holdout = Number(flag("holdout", "0.2"));
const out = flag("out", null);
const nonneg = !args.includes("--allow-negative");
const D = FEATURE_KEYS.length;

// ---------------------------------------------------------------- load

const games = readFileSync(input, "utf8")
  .split("\n")
  .filter((line) => line.length > 0)
  .map((line) => JSON.parse(line))
  .filter((g) => g.error === undefined && g.positions.length > 0);

if (games.length === 0) throw new Error(`no usable games in ${input}`);

/** Rows, as flat parallel arrays — 100k objects would be a lot of pointer
 * chasing for what is ultimately a matrix. */
function build(subset) {
  const n = subset.reduce((sum, g) => sum + g.positions.length * 2, 0);
  const x = new Float64Array(n * D);
  const y = new Float64Array(n);
  const w = new Float64Array(n);
  let i = 0;
  for (const g of subset) {
    // Every game weighs the same, however long it ran.
    const perRow = 1 / (g.positions.length * 2);
    for (const [rowA, rowB] of g.positions) {
      for (const [row, label] of [
        [rowA, g.label],
        [rowB, 1 - g.label],
      ]) {
        for (let d = 0; d < D; d += 1) x[i * D + d] = row[d];
        y[i] = label;
        w[i] = perRow;
        i += 1;
      }
    }
  }
  return { x, y, w, n };
}

// Split by *game*, never by row: two rows from the same game are near
// duplicates, so splitting by row would leak the answer into the holdout and
// report an accuracy that means nothing.
const cut = Math.floor(games.length * (1 - holdout));
const train = build(games.slice(0, cut));
const test = build(games.slice(cut));

console.log(
  `${games.length} games (${train.n} train rows, ${test.n} holdout rows), ` +
    `${D} features, l2=${l2}, epochs=${epochs}`,
);

// ------------------------------------------------------- standardize

const scale = new Float64Array(D);
for (let d = 0; d < D; d += 1) {
  let sum = 0;
  let weight = 0;
  for (let i = 0; i < train.n; i += 1) {
    sum += train.w[i] * train.x[i * D + d] * train.x[i * D + d];
    weight += train.w[i];
  }
  const rms = Math.sqrt(sum / Math.max(weight, 1e-12));
  // A feature that never moves in this data (no game reached it) would divide
  // by zero; leave it at unit scale and let its coefficient fall to zero.
  scale[d] = rms > 1e-9 ? rms : 1;
}

const constant = [];
for (let d = 0; d < D; d += 1) {
  let seen = false;
  for (let i = 0; i < train.n && !seen; i += 1) if (train.x[i * D + d] !== 0) seen = true;
  if (!seen) constant.push(FEATURE_KEYS[d]);
}
if (constant.length > 0) {
  console.log(`  never observed (coefficient left at its starting value): ${constant.join(", ")}`);
}

// ------------------------------------------------------------- fit

const sigmoid = (z) => 1 / (1 + Math.exp(-z));

/** Full-batch Adam. The design matrix is a few MB and fits in cache; batching
 * would buy nothing and cost reproducibility. */
function fit() {
  const w = new Float64Array(D);
  const m = new Float64Array(D);
  const v = new Float64Array(D);
  const grad = new Float64Array(D);
  const b1 = 0.9;
  const b2 = 0.999;
  const eps = 1e-8;

  let totalWeight = 0;
  for (let i = 0; i < train.n; i += 1) totalWeight += train.w[i];

  for (let epoch = 1; epoch <= epochs; epoch += 1) {
    grad.fill(0);
    let loss = 0;
    for (let i = 0; i < train.n; i += 1) {
      let z = 0;
      for (let d = 0; d < D; d += 1) z += w[d] * (train.x[i * D + d] / scale[d]);
      const p = sigmoid(z);
      const r = train.w[i] * (p - train.y[i]);
      for (let d = 0; d < D; d += 1) grad[d] += r * (train.x[i * D + d] / scale[d]);
      const yi = train.y[i];
      loss -= train.w[i] * (yi * Math.log(p + 1e-12) + (1 - yi) * Math.log(1 - p + 1e-12));
    }
    for (let d = 0; d < D; d += 1) {
      const g = grad[d] / totalWeight + l2 * w[d];
      m[d] = b1 * m[d] + (1 - b1) * g;
      v[d] = b2 * v[d] + (1 - b2) * g * g;
      const mh = m[d] / (1 - Math.pow(b1, epoch));
      const vh = v[d] / (1 - Math.pow(b2, epoch));
      w[d] -= (lr * mh) / (Math.sqrt(vh) + eps);
      // Projected gradient: clamping inside the loop rather than at the end
      // lets every other coefficient adapt around the constraint instead of
      // being fitted alongside a value that is then thrown away.
      if (nonneg && w[d] < 0) w[d] = 0;
    }
    if (epoch % 50 === 0 || epoch === epochs) {
      console.log(`  epoch ${String(epoch).padStart(4)}  loss ${(loss / totalWeight).toFixed(5)}`);
    }
  }
  return w;
}

const standardized = fit();

/** Weighted accuracy and log loss on a held-out set of games. */
function evaluateFit(set, w) {
  if (set.n === 0) return null;
  let correct = 0;
  let loss = 0;
  let weight = 0;
  for (let i = 0; i < set.n; i += 1) {
    let z = 0;
    for (let d = 0; d < D; d += 1) z += w[d] * (set.x[i * D + d] / scale[d]);
    const p = sigmoid(z);
    const yi = set.y[i];
    if ((p >= 0.5 ? 1 : 0) === Math.round(yi)) correct += set.w[i];
    loss -= set.w[i] * (yi * Math.log(p + 1e-12) + (1 - yi) * Math.log(1 - p + 1e-12));
    weight += set.w[i];
  }
  return { accuracy: correct / weight, loss: loss / weight };
}

const trainFit = evaluateFit(train, standardized);
const testFit = evaluateFit(test, standardized);
console.log(
  `train acc ${(trainFit.accuracy * 100).toFixed(1)}% loss ${trainFit.loss.toFixed(4)}` +
    (testFit ? `   holdout acc ${(testFit.accuracy * 100).toFixed(1)}% loss ${testFit.loss.toFixed(4)}` : ""),
);

// --------------------------------------------------------- un-scale

const raw = FEATURE_KEYS.map((_, d) => standardized[d] / scale[d]);

// The score is only ever compared with itself, so its overall scale is free.
// Normalising `life` to 1 puts the fitted vector on the same scale every
// hand-picked one has used, which keeps it readable side by side with the
// champions — and keeps the absolute sentinels in `evaluate.ts` (a won game at
// 1e6, a dead player at -1e4) as dominant as they were designed to be.
const lifeIndex = FEATURE_KEYS.indexOf("life");
const norm = Math.abs(raw[lifeIndex]) > 1e-12 ? Math.abs(raw[lifeIndex]) : 1;

const fitted = { ...DEFAULT_WEIGHTS };
for (const [d, key] of FEATURE_KEYS.entries()) {
  if (constant.includes(key)) continue;
  fitted[key] = Number((raw[d] / norm).toFixed(4));
}

// A feature pinned at zero is one the data wanted negative and the constraint
// refused. That's a real signal about the feature, not a bug: it says holding
// that resource *correlates* with losing, so the term can at best be inert.
// Worth printing, since it's the shortlist of terms that need a scenario test
// or a rethink.
const pinned = FEATURE_KEYS.filter((k) => fitted[k] === 0 && !constant.includes(k));
if (pinned.length > 0) {
  console.log(`  pinned at zero by the non-negativity constraint: ${pinned.join(", ")}`);
}
const negative = FEATURE_KEYS.filter((k) => fitted[k] < 0);
if (negative.length > 0) {
  console.log(`  fitted NEGATIVE (predicts losing): ${negative.map((k) => `${k} ${fitted[k]}`).join(", ")}`);
}

console.log("\nfitted weights (life normalised to 1; unfitted terms carried through):");
for (const key of FEATURE_KEYS) {
  const before = DEFAULT_WEIGHTS[key];
  const after = fitted[key];
  const arrow = after > before ? "up" : after < before ? "down" : "same";
  console.log(`  ${key.padEnd(20)} ${String(before).padStart(8)} -> ${String(after).padStart(8)}  ${arrow}`);
}
console.log(JSON.stringify(fitted, null, 2));
if (out) {
  writeFileSync(out, JSON.stringify(fitted, null, 2));
  console.log(`\nwrote ${out}`);
}
