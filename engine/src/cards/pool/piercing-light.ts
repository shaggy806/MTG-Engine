import { defineCard } from "../define.js";

export default defineCard({
  name: "Piercing Light",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text: "Piercing Light deals 2 damage to target attacking or blocking creature. Scry 1. (Look at the top card of your library. You may put that card on the bottom.)",
  targets: ["attacking-or-blocking-creature"],
  effect: {
    kind: "sequence",
    effects: [{ kind: "damage", amount: 2, target: 0 }, { kind: "scry", amount: 1 }],
  },
});
