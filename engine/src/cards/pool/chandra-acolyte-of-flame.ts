import { defineCard } from "../define.js";

// A simplified Chandra, Acolyte of Flame: the +0 drops the "you may pay {R}"
// clause, the −2 drops the "sacrifice them at the next end step" clause.
export default defineCard({
  name: "Chandra, Acolyte of Flame",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Chandra"],
  loyalty: 4,
  text:
    "[+0]: Chandra, Acolyte of Flame deals 2 damage to any target.\n" +
    "[-2]: Create two 1/1 red Elemental creature tokens. They gain haste.",
  activated: [
    {
      loyaltyCost: 0,
      cost: { mana: null, tap: false },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "[+0]: Chandra, Acolyte of Flame deals 2 damage to any target.",
    },
    {
      loyaltyCost: -2,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Elemental Token", count: 2 },
      resolve: null,
      text: "[-2]: Create two 1/1 red Elemental creature tokens. They gain haste.",
    },
  ],
});
