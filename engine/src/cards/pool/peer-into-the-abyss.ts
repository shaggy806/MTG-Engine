import { defineCard } from "../define.js";

// Each half is rounded up and read as its part happens: the cards drawn from
// the library as it stands, then half the life they have after drawing (the
// rulings).
export default defineCard({
  name: "Peer into the Abyss",
  manaCost: "{4}{B}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Target player draws cards equal to half the number of cards in their library and loses half their life. Round up each time.",
  targets: ["player"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", target: 0, amount: { half: { librarySize: "each" }, round: "up" } },
      { kind: "lose-life", target: 0, amount: { half: { lifeTotal: "each" }, round: "up" } },
    ],
  },
});
