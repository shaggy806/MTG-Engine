import { defineCard } from "../define.js";

export default defineCard({
  name: "Scatter Arc",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Counter target noncreature spell.\nDraw a card.",
  targets: ["noncreature-spell"],
  effect: { kind: "sequence", effects: [{ kind: "counter", target: 0 }, { kind: "draw", amount: 1 }] },
});
