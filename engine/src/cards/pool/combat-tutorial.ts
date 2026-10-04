import { defineCard } from "../define.js";

// EDHREC rank 5258.

export default defineCard({
  name: "Combat Tutorial",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Target player draws two cards. Put a +1/+1 counter on up to one target creature you control.",
  targets: ["player", { kind: "optional", of: "creature-you-control" }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 2, target: 0 },
      { kind: "add-counter", target: 1, counter: "+1/+1", amount: 1 },
    ],
  },
});
