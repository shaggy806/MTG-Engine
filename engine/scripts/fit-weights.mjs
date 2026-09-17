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
// ## Two models, because there are two kinds of training data
//
// **Positions** (`bot:harvest`): `P(this seat wins) = sigmoid(w . x)`, where `x`
// is the sign-folded difference vector `evaluateState` already computes — so `w`
// *is* an `EvalWeights`, in log-odds-per-unit-of-feature, and needs no
// translation to be used.
//
// **Pairs** (`bot:harvest --pairs`, then `bot:fit --pairs`): two sibling moves
// from one decision point, each played out `n` times, with win counts `wA` and
// `wB`. The target is the *log-odds difference* between the two siblings,
//
//     y = logit((wA + 0.5) / (n + 1)) - logit((wB + 0.5) / (n + 1))
//
// regressed on `x = xA - xB` by weighted least squares. Three things this buys
// over collapsing the pair to "A won":
//
// - It keeps the magnitude. A 20-to-4 split and an 11-to-10 split are very
//   different claims about how much the move mattered.
// - The half-counts are the Haldane correction, which keeps a 20-0 sweep finite
//   instead of infinite.
// - Rows are weighted by inverse variance, `1/Var(y)` with
//   `Var(logit p̂) ≈ 1/(n p q)`, so a pair whose rates are near 0 or 1 — where
//   the log-odds estimate is at its noisiest — counts for less.
//
// Everything downstream is shared: the same standardization, the same prior
// shrinkage, the same non-negativity projection, the same land-drop invariant.
// Only the loss differs, and only by whether `w . x` passes through a sigmoid.
//
// ## The two are complementary, and that isn't a compromise
//
// Cancelling the confound also cancels the *signal* for any feature the move
// doesn't move. Measured on a pair harvest: `life`, `library`, `commanderDamage`
// and `loyalty` are reported "never observed", because two candidate moves at
// one decision point usually leave all four identical and the difference vector
// is zero there. Pairs can say what a *move* is worth and are structurally
// silent on what a *state* is worth; positions are the reverse, and their
// silence is the noisier kind, since they answer confidently and wrongly.
//
// So the intended pipeline runs both, and the prior machinery already composes
// them with no extra mechanism:
//
//   bot:fit                       --in positions.ndjson --out base.json
//   bot:fit --pairs --prior-file base.json --in pairs.ndjson --out final.json
//
// Positions set every term; pairs then correct the ones moves actually
// influence, and leave the rest at the position fit's value. Terms neither can
// speak to fall back to the hand-picked vector, which is where they started.
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
// ## Shrinking toward the hand-picked vector, not toward zero
//
// Non-negativity is a blunt instrument: it stops a coefficient inverting, but
// not from being far too large in the right direction. The constrained fit on
// 4000 games still produced `commanderTax 10.5` (a commander recast four times
// is one that died four times) and `untappedCreatures 3.1` (a creature that
// stayed home is one that wasn't forced to trade) — both the same confound,
// and between them they made the bot refuse to recast its commander and refuse
// to attack a board it could safely attack.
//
// So the L2 penalty pulls each coefficient toward the *hand-picked* value
// rather than toward zero. That's ordinary ridge with a non-zero prior mean,
// and here it says exactly the right thing: the hand-picked vector encodes
// causal knowledge the data cannot see, so move away from it only where the
// data insists. `--prior-l2` is the dial between trusting the human and
// trusting the data, and `--prior zero` restores plain ridge.
//
// It needs two passes, because the prior and the fit live on different scales:
// a logistic fit is in log-odds and the hand-picked vector is normalised to
// `life = 1`, and the overall scale of an evaluation is free. So the first pass
// (prior zero) exists only to learn what `life` is worth in log-odds, and the
// second shrinks toward the hand-picked vector rescaled by that. Both passes
// take seconds.
//
// ## Two terms are excluded outright
//
// `PRIOR_ONLY` below. The bar for putting a term there is evidence *independent
// of the scenario gate* that its fitted direction is confounded — a structural
// argument or an earlier measurement — never "the gate went red".
//
// **`commanderTax`.** Even shrunk hard toward the hand-picked 0.5 the fit kept
// pulling it to 6.7, and the bot kept refusing to recast its commander. The
// regression is reporting something true that the *feature* gets wrong: it
// isn't a description of the position, it counts how many times the commander
// has already died, which is about as pure a symptom of losing as the state
// carries. And the cost it stands for is already charged where costs are
// charged — `Game.castingCostOf` folds the tax into the real mana cost (rule
// 903.8), so the spell is already unaffordable exactly when it should be.
// Scoring it again double-counts it, and unlike the mana cost the evaluation's
// copy is charged *every turn, forever*, not once at cast time.
//
// **`untappedMana`.** The fit wants it at 1.66, up from a deliberate 0. At that
// value tapping seven lands costs 11.6 — more than a recast commander is worth —
// and the bot stops spending mana at all. Untapped mana at end of turn is the
// mana of someone who was comfortable, so it predicts winning beautifully and
// causes nothing. This one doesn't rest on argument alone: Phase 1 measured it,
// at a sixteenth of the fitted value, costing eight points of win rate at four
// players (36% -> 28%, with `handManaValue`, in the ablation table above). The
// fit rediscovering it is confirmation, not news. `handManaValue` is the other
// half of that pair and the non-negativity constraint already pins it to zero.
//
// ## The land-drop invariant
//
// Non-negativity is a bound on one coefficient at a time, and the failure it
// can't see is a *relationship* between two. A land drop moves a card from hand
// to the battlefield, so it scores `lands - hand` (or `extraLands - hand` past
// the cap). Both land terms must therefore stay above `hand`, or a land drop is
// a loss and the bot stops developing — which `evaluate.ts` has said in a
// comment since Phase 1 and nothing enforced.
//
// It bites here because the fit reads `extraLands` as strongly negative, the
// constraint pins it at 0, and 0 is not enough: against a fitted `hand` of 3.6,
// a land drop past the cap still scores -3.6. So after fitting, a land term
// short of `hand` is raised to it, keeping the hand-picked vector's own
// `extraLands`-to-`hand` ratio rather than inventing a margin. Both repairs are
// reported.
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
const pairsMode = args.includes("--pairs");
const usePrior = flag("prior", "baseline") !== "zero";
const priorL2 = Number(flag("prior-l2", "0.02"));
// What to shrink toward, and what an unfitted term falls back to. Defaults to
// the hand-picked vector; a pairs fit normally points this at the position
// fit's output instead — see "The two are complementary" above.
const priorFile = flag("prior-file", null);
const BASE = priorFile === null
  ? DEFAULT_WEIGHTS
  : { ...DEFAULT_WEIGHTS, ...JSON.parse(readFileSync(priorFile, "utf8")) };
const D = FEATURE_KEYS.length;

// ---------------------------------------------------------------- load

const games = readFileSync(input, "utf8")
  .split("\n")
  .filter((line) => line.length > 0)
  .map((line) => JSON.parse(line))
  .filter((g) => g.error === undefined && (pairsMode ? g.pairs.length > 0 : g.positions.length > 0));

if (games.length === 0) throw new Error(`no usable games in ${input}`);

const logit = (p) => Math.log(p / (1 - p));

/** Rows, as flat parallel arrays — 100k objects would be a lot of pointer
 * chasing for what is ultimately a matrix. */
function build(subset) {
  const rows = subset.reduce((sum, g) => sum + (pairsMode ? g.pairs.length : g.positions.length * 2), 0);
  const x = new Float64Array(rows * D);
  const y = new Float64Array(rows);
  const w = new Float64Array(rows);
  let i = 0;
  for (const g of subset) {
    if (pairsMode) {
      const n = g.playouts;
      for (const pair of g.pairs) {
        // Haldane correction: a 20-0 sweep is a finite piece of evidence, not
        // an infinite one.
        const pA = (pair.winsA + 0.5) / (n + 1);
        const pB = (pair.winsB + 0.5) / (n + 1);
        for (let d = 0; d < D; d += 1) x[i * D + d] = pair.xA[d] - pair.xB[d];
        y[i] = logit(pA) - logit(pB);
        // Inverse variance. A rate near 0 or 1 is where a log-odds estimate is
        // noisiest, so those pairs speak more quietly.
        const variance = 1 / (n * pA * (1 - pA)) + 1 / (n * pB * (1 - pB));
        w[i] = 1 / variance;
        i += 1;
      }
    } else {
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
  }
  return { x, y, w, n: rows };
}

// Split by *game*, never by row: two rows from the same game are near
// duplicates, so splitting by row would leak the answer into the holdout and
// report an accuracy that means nothing.
const cut = Math.floor(games.length * (1 - holdout));
const train = build(games.slice(0, cut));
const test = build(games.slice(cut));

console.log(
  `${games.length} games (${train.n} train rows, ${test.n} holdout rows), ${pairsMode ? "pairs" : "positions"}, ` +
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

/**
 * Full-batch Adam. The design matrix is a few MB and fits in cache; batching
 * would buy nothing and cost reproducibility.
 *
 * `prior` (in standardized space) is what the L2 penalty pulls toward, and
 * `lambda` is how hard. A zero prior is plain ridge.
 */
function fit(prior = null, lambda = l2) {
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
      // Squared error on a log-odds difference for pairs, log loss on a 0/1
      // outcome for positions. The gradient has the same shape either way —
      // residual times feature — which is why one loop serves both.
      const p = pairsMode ? z : sigmoid(z);
      const yi = train.y[i];
      const r = train.w[i] * (p - yi);
      for (let d = 0; d < D; d += 1) grad[d] += r * (train.x[i * D + d] / scale[d]);
      loss += pairsMode
        ? train.w[i] * (p - yi) * (p - yi)
        : -train.w[i] * (yi * Math.log(p + 1e-12) + (1 - yi) * Math.log(1 - p + 1e-12));
    }
    for (let d = 0; d < D; d += 1) {
      const g = grad[d] / totalWeight + lambda * (w[d] - (prior === null ? 0 : prior[d]));
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

const lifeIndex = FEATURE_KEYS.indexOf("life");

// Pass one: plain ridge, whose only job (when a prior is in play) is to say
// what `life` is worth in log-odds, since that's the scale the hand-picked
// vector has to be expressed in before it can be shrunk toward.
let standardized = fit();

/**
 * Log-odds per unit of the prior's scale — the exchange rate between the two,
 * and the whole reason for the first pass.
 *
 * In positions mode `life` alone would do, since the prior is normalised to
 * `life = 1`. In pairs mode it won't: `life` is one of the features two sibling
 * moves almost always leave identical, so it is never observed and the first
 * pass gives it no weight at all. The rate is therefore taken as the
 * least-squares scale that best maps the prior onto the first pass across
 * *every* feature — which reduces to exactly `life`'s ratio when `life` is the
 * only thing that varies, and stays defined when it isn't.
 */
function exchangeRate(raw1) {
  let num = 0;
  let den = 0;
  for (const [d, key] of FEATURE_KEYS.entries()) {
    num += BASE[key] * raw1[d];
    den += BASE[key] * BASE[key];
  }
  return den > 1e-12 ? Math.abs(num / den) : 0;
}

let rate = 1;
if (usePrior) {
  const raw1 = FEATURE_KEYS.map((_, d) => standardized[d] / scale[d]);
  rate = exchangeRate(raw1);
  if (rate < 1e-12) throw new Error("first pass found no signal at all; can't scale the prior");
  const prior = new Float64Array(D);
  for (const [d, key] of FEATURE_KEYS.entries()) prior[d] = BASE[key] * rate * scale[d];
  console.log(`  pass 2: shrinking toward the prior (rate ${rate.toFixed(4)}), prior-l2=${priorL2}`);
  standardized = fit(prior, priorL2);
}

/**
 * Held-out performance. For positions that's the share of seats whose winner it
 * calls correctly; for pairs it's the share of sibling comparisons it ranks the
 * right way round — which is the only thing the search actually needs it to do.
 */
function evaluateFit(set, w) {
  if (set.n === 0) return null;
  let correct = 0;
  let loss = 0;
  let weight = 0;
  for (let i = 0; i < set.n; i += 1) {
    let z = 0;
    for (let d = 0; d < D; d += 1) z += w[d] * (set.x[i * D + d] / scale[d]);
    const yi = set.y[i];
    if (pairsMode) {
      // A tie in the playouts has no right answer to get right, so it's not
      // counted either way.
      if (yi !== 0 && Math.sign(z) === Math.sign(yi)) correct += set.w[i];
      if (yi !== 0) weight += set.w[i];
      loss += set.w[i] * (z - yi) * (z - yi);
    } else {
      const p = sigmoid(z);
      if ((p >= 0.5 ? 1 : 0) === Math.round(yi)) correct += set.w[i];
      loss -= set.w[i] * (yi * Math.log(p + 1e-12) + (1 - yi) * Math.log(1 - p + 1e-12));
      weight += set.w[i];
    }
  }
  const total = set.w.reduce((a, b) => a + b, 0);
  return { accuracy: weight > 0 ? correct / weight : 0, loss: loss / total };
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
// The same exchange rate the prior was scaled by, undone — which puts the
// output back on the prior's scale, so an unfitted term carried through from
// `BASE` and a fitted one beside it mean the same thing. With no prior in play
// there's nothing to agree with, so `life` sets the scale as before.
const norm = usePrior
  ? rate
  : Math.abs(raw[lifeIndex]) > 1e-12
    ? Math.abs(raw[lifeIndex])
    : 1;

/** Linear terms whose *fitted* value is thrown away — see the note above. */
const PRIOR_ONLY = ["commanderTax", "untappedMana"];

const fitted = { ...BASE };
for (const [d, key] of FEATURE_KEYS.entries()) {
  if (constant.includes(key) || PRIOR_ONLY.includes(key)) continue;
  fitted[key] = Number((raw[d] / norm).toFixed(4));
}
console.log(`  excluded, hand-set value kept: ${PRIOR_ONLY.join(", ")}`);

// The land-drop invariant — see the note above. The margin comes from the
// hand-picked vector's own ratio, so it's the prior speaking rather than a
// number invented here.
const margin = DEFAULT_WEIGHTS.extraLands / DEFAULT_WEIGHTS.hand;
for (const key of ["lands", "extraLands"]) {
  const floor = Number((fitted.hand * margin).toFixed(4));
  if (fitted[key] < floor) {
    console.log(`  ${key} ${fitted[key]} is below hand ${fitted.hand} — raised to ${floor} (a land drop must gain)`);
    fitted[key] = floor;
  }
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
  const before = BASE[key];
  const after = fitted[key];
  const arrow = after > before ? "up" : after < before ? "down" : "same";
  console.log(`  ${key.padEnd(20)} ${String(before).padStart(8)} -> ${String(after).padStart(8)}  ${arrow}`);
}
console.log(JSON.stringify(fitted, null, 2));
if (out) {
  writeFileSync(out, JSON.stringify(fitted, null, 2));
  console.log(`\nwrote ${out}`);
}
