import { defineCard } from "../define.js";

// EDHREC rank 2650.
export default defineCard({
  name: "Prologue to Phyresis",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Each opponent gets a poison counter.\nDraw a card.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "add-player-counters", counter: "poison", amount: 1, who: "each-opponent" },
      { kind: "draw", amount: 1 },
    ],
  },
});
