import { defineCard } from "../define.js";

const TEXT =
  "{T}: Add one mana of any color. If you control a creature with power 4 or greater, add two mana of any one color instead.";

// Urza's Tower's shape: the amount is read as the mana is made, and
// `any-color` above one is all of one colour.
export default defineCard({
  name: "Ilysian Caryatid",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant"],
  power: 1,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
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
