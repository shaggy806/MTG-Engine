import { defineCard } from "../define.js";

// EDHREC rank 5320.

export default defineCard({
  name: "Delete",
  manaCost: "{X}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Delete deals X damage to each nonartifact creature and each player.",
  effect: {
    kind: "sequence",
    simultaneous: true,
    effects: [
      { kind: "damage-all", filter: { type: "creature", notTypes: ["artifact"] }, amount: "x" },
      { kind: "damage", amount: "x", who: "each-player" },
    ],
  },
});
