// Engine playground: build a two-player game and print its event log.
//
//   npm run play -w engine
//   npm run play -w engine -- --seed 7
//   npm run play -w engine -- --turns 3        # stop before turn 3 instead of playing to the end
//
// The npm script runs `tsc` first, so this always uses a fresh build in ../dist.

import { Game, asPlayerId } from "../dist/index.js";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};

const seed = Number(flag("seed", "42"));
const stopBeforeTurn = flag("turns", null);

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const deck = (n) =>
  Array.from({ length: n }, (_, i) => (i % 2 ? "Grizzly Bears" : "Forest"));

const game = Game.create({
  seed,
  decks: [
    { player: A, cards: deck(40) },
    { player: B, cards: deck(40) },
  ],
});

if (stopBeforeTurn !== null) {
  game.advanceUntil((s) => s.turn.number >= Number(stopBeforeTurn));
} else {
  game.advance();
}

const cardName = (id) => game.state.objects[id]?.cardName ?? id;

const describe = (e) => {
  switch (e.type) {
    case "game-started":
      return `players=${e.players.join(", ")}  starting=${e.startingPlayer}  seed=${e.seed}`;
    case "turn-began":
      return `turn ${e.turn} — ${e.activePlayer}`;
    case "step-began":
      return `[${e.phase}] ${e.step}`;
    case "priority-received":
      return `→ ${e.player}`;
    case "priority-passed":
      return `${e.player} passes`;
    case "permanent-untapped":
      return cardName(e.object);
    case "card-drawn":
      return `${e.player} draws ${cardName(e.object)}`;
    case "draw-from-empty-library":
      return `${e.player} draws from an empty library!`;
    case "cards-discarded":
      return `${e.player} discards ${e.objects.map(cardName).join(", ")}`;
    case "damage-cleared":
      return `${e.objects.length} permanent(s)`;
    case "player-lost":
      return `${e.player}: ${e.reason}`;
    case "game-ended":
      return e.winner ? `${e.winner} wins — ${e.reason}` : `draw — ${e.reason}`;
    default:
      return JSON.stringify(e);
  }
};

for (const e of game.events) {
  console.log(`#${String(e.seq).padStart(4)}  ${e.type.padEnd(24)} ${describe(e)}`);
}

console.log("");
console.log(`events: ${game.events.length}`);
console.log(`turns:  ${game.state.turn.number}`);
console.log(
  `result: ${
    game.isOver
      ? `${game.winner ?? "draw"} — ${game.state.result.reason}`
      : "in progress"
  }`,
);
for (const p of game.state.turnOrder) {
  const ps = game.state.players[p];
  console.log(
    `  ${p}: ${ps.life} life · hand ${game.handOf(p).length} · library ${
      game.libraryOf(p).length
    } · graveyard ${game.graveyardOf(p).length}`,
  );
}
