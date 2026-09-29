import { defineCard } from "../define.js";

// Each player draws for what they themselves discarded.
export default defineCard({
  name: "Dark Deal",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Each player discards all the cards in their hand, then draws that many cards minus one.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "discard-hand", who: "each-player" },
      {
        kind: "draw",
        who: "each-player",
        amount: { difference: [{ thisWay: "discarded", who: "each" }, 1] },
      },
    ],
  },
});
