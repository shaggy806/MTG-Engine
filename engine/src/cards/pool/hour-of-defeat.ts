import { defineCard } from "../define.js";

export default defineCard({
  name: "Hour of Defeat",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Destroy target creature. Surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "destroy", target: 0 }, { kind: "surveil", amount: 1 }],
  },
});
