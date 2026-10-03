import { defineCard } from "../define.js";

// Every player draws the same number: the most any one player discarded.
export default defineCard({
  name: "Windfall",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Each player discards their hand, then draws cards equal to the greatest number of cards a player discarded this way.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "discard-hand", who: "each-player" },
      { kind: "draw", who: "each-player", amount: { thisWay: "discarded", perPlayer: "greatest" } },
    ],
  },
});
