import { defineCard } from "../define.js";

// EDHREC rank 6140.
//
// Rulings:
//   [2004-10-04] Can never affect the colored part of the cost.
//   [2004-10-04] If a spell is both green and blue, you pay {1} less, not {2} less.
//   [2004-10-04] The lower cost is not optional like with some other cost reducers.
//   [2004-10-04] The effect is cumulative.
//   [2004-10-04] This can lower the cost to zero, but not below zero.

export default defineCard({
  name: "Sunscape Familiar",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 3,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)\nGreen spells and blue spells you cast cost {1} less to cast.",
  static: [
    {
      affects: { scope: "self" },
      // One reduction for a spell that's green, blue or both (the ruling).
      costModification: {
        applies: { anyOf: [{ colors: ["G"] }, { colors: ["U"] }] },
        caster: "you",
        reduceGeneric: 1,
      },
      text: "Green spells and blue spells you cast cost {1} less to cast.",
    },
  ],
});
