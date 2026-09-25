import { defineCard } from "../define.js";

export default defineCard({
  name: "Contradict",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target spell.\nDraw a card.",
  targets: ["spell"],
  effect: { kind: "sequence", effects: [{ kind: "counter", target: 0 }, { kind: "draw", amount: 1 }] },
});
