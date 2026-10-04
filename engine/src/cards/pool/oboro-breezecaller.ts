import { defineCard } from "../define.js";

// EDHREC rank 6227.
//
// Meloku's "Return a land you control to its owner's hand" cost.
const TEXT = "{2}, Return a land you control to its owner's hand: Untap target land.";

export default defineCard({
  name: "Oboro Breezecaller",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Moonfolk", "Wizard"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  activated: [
    {
      cost: { mana: "{2}", tap: false, returnToHand: { count: 1, filter: { type: "land" } } },
      targets: ["land"],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: TEXT,
    },
  ],
});
