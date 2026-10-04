import { defineCard } from "../define.js";

// EDHREC rank 5393.

const TEXT = "Sacrifice this creature: Prevent all combat damage that would be dealt this turn.";

export default defineCard({
  name: "Kami of False Hope",
  manaCost: "{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "prevent-all-combat-damage" },
      resolve: null,
      text: TEXT,
    },
  ],
});
