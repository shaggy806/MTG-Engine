import { defineCard } from "../define.js";

export default defineCard({
  name: "Banishing Betrayal",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Return target nonland permanent to its owner's hand. Surveil 1. (Look at the top card of your library. You may put it into your graveyard.)",
  targets: ["nonland-permanent"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "return-to-hand", target: 0 }, { kind: "surveil", amount: 1 }],
  },
});
