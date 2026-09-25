import { defineCard } from "../define.js";

export default defineCard({
  name: "Daily Bugle Newspaper",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "{2}, {T}: Draw a card, then discard a card. Create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "sequence",
            effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
          },
          { kind: "create-token", token: "Treasure Token", count: 1 },
        ],
      },
      resolve: null,
      text: "{2}, {T}: Draw a card, then discard a card. Create a Treasure token.",
    },
  ],
});
