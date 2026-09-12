import { defineCard } from "../define.js";

// needed-cards P13. "Each creature without flying and each planeswalker" is
// two independent damage-all sweeps (a new CardFilter.notKeyword for the
// first) rather than one filter — no card in the pool is both a creature and
// a planeswalker, so the union never double-hits anything.
export default defineCard({
  name: "Magmaquake",
  manaCost: "{X}{R}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Magmaquake deals X damage to each creature without flying and each planeswalker.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "damage-all", filter: { type: "creature", notKeyword: "flying" }, amount: "x" },
      { kind: "damage-all", filter: { type: "planeswalker" }, amount: "x" },
    ],
  },
});
