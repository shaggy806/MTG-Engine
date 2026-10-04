import { defineCard } from "../define.js";

// EDHREC rank 4824.
//
// Rulings:
//   [2021-11-19] Ancestral Anger isn't put into your graveyard until after it finishes resolving,
//     so it doesn't count itself for its own effect.
//   [2026-03-20] Ancestral Anger isn't put into your graveyard until after it finishes resolving,
//     so it doesn't count itself for its own effect.

export default defineCard({
  name: "Ancestral Anger",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Target creature gains trample and gets +X/+0 until end of turn, where X is 1 plus the number of cards named Ancestral Anger in your graveyard.\nDraw a card.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "grant-keyword", target: 0, keyword: "trample", duration: "end-of-turn" },
      {
        kind: "modify-pt",
        target: 0,
        power: { sum: [1, { countInGraveyard: { name: "Ancestral Anger", ownedBy: "you" } }] },
        toughness: 0,
        duration: "end-of-turn",
      },
      { kind: "draw", amount: 1 },
    ],
  },
});
