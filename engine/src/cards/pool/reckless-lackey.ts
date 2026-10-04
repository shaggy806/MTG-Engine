import { defineCard } from "../define.js";

// EDHREC rank 6119.

const TEXT = "{2}{R}, Sacrifice this creature: Draw a card and create a Treasure token.";

export default defineCard({
  name: "Reckless Lackey",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Pirate"],
  power: 1,
  toughness: 2,
  keywords: ["first-strike", "haste"],
  text: `First strike, haste\n${TEXT} (It's an artifact with "{T}, Sacrifice this token: Add one mana of any color.")`,
  activated: [
    {
      cost: { mana: "{2}{R}", tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "create-token", token: "Treasure Token", count: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
