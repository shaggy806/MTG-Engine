import { defineCard } from "../define.js";

const TEXT =
  "At the beginning of your end step, create a Treasure token for each creature that died this turn. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")";

// Every creature that died this turn, whoever controlled it.
export default defineCard({
  name: "Mahadi, Emporium Master",
  manaCost: "{1}{B}{R}",
  colors: ["B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Devil"],
  power: 3,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "create-token",
        token: "Treasure Token",
        count: { creaturesDiedThisTurn: true, anyController: true },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
