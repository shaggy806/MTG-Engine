import { defineCard } from "../define.js";

// EDHREC rank 6178.
//
// Rulings:
//   [2022-12-08] You can tap any untapped creature you control to activate Opposition's ability,
//     even one you haven't controlled continuously since the beginning of your most recent turn.

const TEXT = "Tap an untapped creature you control: Tap target artifact, creature, or land.";

export default defineCard({
  name: "Opposition",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: TEXT,
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 1, filter: { type: "creature", controlledBy: "you" } },
      },
      targets: [{ kind: "permanent", filter: { typesAnyOf: ["artifact", "creature", "land"] } }],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: TEXT,
    },
  ],
});
