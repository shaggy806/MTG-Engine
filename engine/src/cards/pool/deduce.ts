import { defineCard } from "../define.js";

export default defineCard({
  name: "Deduce",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Draw a card. Investigate. (Create a Clue token. It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")",
  effect: {
    kind: "sequence",
    effects: [{ kind: "draw", amount: 1 }, { kind: "create-token", token: "Clue Token", count: 1 }],
  },
});
