import { defineCard } from "../define.js";

export default defineCard({
  name: "Dissolve",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target spell. Scry 1. (Look at the top card of your library. You may put that card on the bottom.)",
  targets: ["spell"],
  effect: { kind: "sequence", effects: [{ kind: "counter", target: 0 }, { kind: "scry", amount: 1 }] },
});
