import { defineCard } from "../define.js";

const TEXT = "{1}{R}, {T}, Sacrifice this creature: Each player discards their hand, then draws seven cards.";

export default defineCard({
  name: "Magus of the Wheel",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 3,
  toughness: 3,
  text: TEXT,
  activated: [
    {
      cost: { mana: "{1}{R}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "discard-hand", who: "each-player" },
          { kind: "draw", amount: 7, who: "each-player" },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
