import { defineCard } from "../define.js";

// EDHREC rank 6243.

const TEXT = "{T}: Add {G}. If you control a creature with power 4 or greater, add {G}{G} instead.";

// Ilysian Caryatid's shape: the amount is read as the mana is made.
export default defineCard({
  name: "Raucous Audience",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Citizen"],
  power: 2,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "G",
        amount: {
          ifCondition: {
            kind: "controls",
            filter: { type: "creature", power: { op: "gte", n: 4 } },
            atLeast: 1,
          },
          then: 2,
          else: 1,
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
