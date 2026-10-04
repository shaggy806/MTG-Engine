import { defineCard } from "../define.js";

// EDHREC rank 4140.
// Makes Treasure → use "Treasure Token".

const WIN_TEXT = "Whenever you win a coin flip, create two Treasure tokens.";
const FLIP_TEXT = "{1}, {T}, Sacrifice another permanent: Flip a coin.";

export default defineCard({
  name: "Tavern Scoundrel",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 1,
  toughness: 3,
  text: `${WIN_TEXT} (They're artifacts with "{T}, Sacrifice this token: Add one mana of any color.")\n${FLIP_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}", tap: true, sacrifice: { filter: {} } },
      otherOnly: true,
      targets: [],
      effect: { kind: "flip-coin" },
      resolve: null,
      text: FLIP_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "wins-coin-flip", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 2 },
      resolve: null,
      text: WIN_TEXT,
    },
  ],
});
