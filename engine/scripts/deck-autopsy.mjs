// Replay one `deck-winrates.mjs` game and print what each deck did, turn by
// turn: lands played, spells cast, abilities activated, attacks and where
// they went, damage to players, mulligans and mills — plus, at each turn's
// start, every player's life, cards in hand, library, graveyard and board.
// What a deck autopsy reads: how a deck that loses is losing.
//
//   npm run build -w engine
//   node engine/scripts/deck-autopsy.mjs --seed 39 [--file .scratch/deck-winrates-v2-4p.ndjson]
//   node engine/scripts/deck-autopsy.mjs --seed 7 --decks "Sultai Arisen|Temur Roar|Grave Danger|First Flight"
//   [--bot v2|v1] [--hands] (print hands at each snapshot) [--until TURN]
//
// Same seed, decks, seating and bots as the run, so the game replays exactly
// (count budgets: v2's default, no clock).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  COMMANDER_RULES,
  EvalBotController,
  Game,
  HeuristicBotController,
  STARTER_DECKS,
  asPlayerId,
  computeCharacteristics,
  createDefaultRegistry,
  printedCardName,
} from "../dist/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const seed = Number(flag("seed", "1"));
const bot = flag("bot", "v2");
const showHands = args.includes("--hands");
const until = Number(flag("until", "9999"));
let deckNames = flag("decks", null)?.split("|");
if (deckNames === undefined || deckNames === null) {
  const file = flag("file", join(ROOT, ".scratch", `deck-winrates-${bot}-4p.ndjson`));
  const row = readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l))
    .find((r) => r.seed === seed);
  if (!row) throw new Error(`seed ${seed} isn't in ${file}; pass --decks`);
  deckNames = row.decks;
}
const registry = createDefaultRegistry();
const decks = deckNames.map((n) => {
  const d = STARTER_DECKS.find((x) => x.name === n);
  if (!d) throw new Error(`no starter deck named ${n}`);
  return d;
});
const seats = ["alice", "bob", "carol", "dave"].slice(0, decks.length).map(asPlayerId);
const deckOf = new Map(seats.map((s, i) => [s, decks[i].name]));
const label = (p) => `${deckOf.get(p) ?? p}`;

let game;
let lastTurn = -1;
const snapshot = () => {
  const s = game.state;
  const lines = [];
  for (const p of seats) {
    const pl = s.players[p];
    if (pl.hasLost) continue;
    const zones = s.zones.perPlayer[p];
    const mine = s.zones.shared.battlefield.filter((id) => s.objects[id]?.controller === p);
    let lands = 0;
    let creatures = 0;
    let power = 0;
    const other = [];
    for (const id of mine) {
      const c = computeCharacteristics(s, registry, id);
      const n = s.objects[id].stackCount ?? 1;
      if (c.types.includes("land")) lands += n;
      else if (c.types.includes("creature")) {
        creatures += n;
        power += c.power * n;
      } else other.push(printedCardName(s.objects[id]));
    }
    lines.push(
      `    ${label(p).padEnd(20)} life ${String(pl.life).padStart(3)}  hand ${zones.hand.length}  lib ${zones.library.length}  gy ${zones.graveyard.length}  lands ${lands}  creatures ${creatures} (power ${power})` +
        (other.length ? `  other: ${other.join(", ")}` : "") +
        (showHands ? `\n      hand: ${zones.hand.map((id) => printedCardName(s.objects[id])).join(", ")}` : ""),
    );
  }
  return lines.join("\n");
};

const controllers = Object.fromEntries(
  seats.map((seat) => {
    const c = bot === "v1" ? new HeuristicBotController(seat, registry) : new EvalBotController(seat, registry);
    const act = c.act.bind(c);
    c.act = (view) => {
      if (view.state.turn.number !== lastTurn) {
        lastTurn = view.state.turn.number;
        pending.push({ kind: "snap", turn: lastTurn, text: snapshot() });
        if (lastTurn > until) throw new Error("until");
      }
      return act(view);
    };
    return [seat, c];
  }),
);
const pending = [];

console.log(`deck autopsy — seed ${seed}, ${bot}: ${seats.map((s, i) => `${s} = ${decks[i].name}`).join(", ")}`);
try {
  game = Game.create({
    seed,
    registry,
    controllers,
    mulligans: true,
    rules: COMMANDER_RULES,
    decks: seats.map((player, i) => ({ player, cards: decks[i].cards, commanders: decks[i].commanders })),
  });
  game.advance();
} catch (e) {
  if (String(e?.message) !== "until") throw e;
}

// Walk the events in order, printing a snapshot at each turn's start.
const nameOf = (id) => {
  const o = game.state.objects[id];
  return o ? printedCardName(o) : (game.state.lastKnown?.[id]?.name ?? String(id));
};
const snaps = new Map(pending.filter((p) => p.kind === "snap").map((p) => [p.turn, p.text]));
let line = [];
const flush = () => {
  if (line.length) console.log("    " + line.join("; "));
  line = [];
};
for (const e of game.events) {
  switch (e.type) {
    case "turn-began":
      flush();
      console.log(`\nTURN ${e.turn} — ${label(e.activePlayer)}${e.extra ? " (extra)" : ""}`);
      if (snaps.has(e.turn)) console.log(snaps.get(e.turn));
      break;
    case "mulligan-taken":
      line.push(`${label(e.player)} mulligans (${e.count})`);
      break;
    case "land-played":
      line.push(`${label(e.player)} plays ${nameOf(e.object)}`);
      break;
    case "spell-cast":
      line.push(`${label(e.player)} casts ${nameOf(e.object)}`);
      break;
    case "ability-activated":
      if (e.onStack) line.push(`${label(e.player)} activates ${nameOf(e.source)}`);
      break;
    case "attacker-declared":
      line.push(
        `attack: ${nameOf(e.attacker)} → ${game.state.players[e.defender] ? label(e.defender) : nameOf(e.defender)}`,
      );
      break;
    case "damage-dealt":
      if (e.target.kind === "player" && e.amount > 0) line.push(`${nameOf(e.source)} hits ${label(e.target.player)} for ${e.amount}`);
      break;
    case "cards-milled":
      line.push(`${label(e.player)} mills ${e.objects.length}`);
      break;
    case "player-lost":
      flush();
      console.log(`  ✗ ${label(e.player)} loses (${e.reason})`);
      break;
    case "game-ended":
      flush();
      console.log(`\nGAME OVER — winner: ${e.winner ? label(e.winner) : "none"} (${e.reason}), turn ${game.state.turn.number}`);
      break;
    default:
      break;
  }
}
flush();
