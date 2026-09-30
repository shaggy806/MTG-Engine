import { defineCard } from "../define.js";

export default defineCard({
  name: "Perplexing Test",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text:
    "Choose one —\n" +
    "• Return all creature tokens to their owners' hands.\n" +
    "• Return all nontoken creatures to their owners' hands.",
  castModal: {
    minModes: 1,
    maxModes: 1,
    modes: [
      {
        text: "Return all creature tokens to their owners' hands.",
        targets: [],
        effect: { kind: "return-to-hand-all", filter: { type: "creature", token: true } },
      },
      {
        text: "Return all nontoken creatures to their owners' hands.",
        targets: [],
        effect: { kind: "return-to-hand-all", filter: { type: "creature", token: false } },
      },
    ],
  },
});
