import { defineCard } from "../define.js";

// EDHREC rank 4632.
//
// Every attacking creature, whoever controls it, counted as it resolves.

export default defineCard({
  name: "Keep Watch",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Draw a card for each attacking creature.",
  effect: { kind: "draw", amount: { countOf: { type: "creature", attacking: true } } },
});
