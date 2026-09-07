import { defineCard } from "../define.js";

export default defineCard({
  name: "Opt",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Scry 1, then draw a card.",
  effect: { kind: "scry", amount: 1, then: { kind: "draw", amount: 1 } },
});
