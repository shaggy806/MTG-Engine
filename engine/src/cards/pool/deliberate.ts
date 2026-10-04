import { defineCard } from "../define.js";

// EDHREC rank 4845.

export default defineCard({
  name: "Deliberate",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Scry 2, then draw a card.",
  effect: { kind: "scry", amount: 2, then: { kind: "draw", amount: 1 } },
});
