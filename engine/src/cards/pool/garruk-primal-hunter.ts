import { defineCard } from "../define.js";

const PLUS_TEXT = "+1: Create a 3/3 green Beast creature token.";
const MINUS_TEXT = "−3: Draw cards equal to the greatest power among creatures you control.";
const ULT_TEXT = "−6: Create a 6/6 green Wurm creature token for each land you control.";

export default defineCard({
  name: "Garruk, Primal Hunter",
  manaCost: "{2}{G}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Garruk"],
  loyalty: 3,
  text: `${PLUS_TEXT}\n${MINUS_TEXT}\n${ULT_TEXT}`,
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "create-token", token: "3/3 Beast Token", count: 1 },
      resolve: null,
      text: PLUS_TEXT,
    },
    {
      loyaltyCost: -3,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "draw",
        amount: { aggregate: "max", of: "power", filter: { type: "creature", controlledBy: "you" } },
      },
      resolve: null,
      text: MINUS_TEXT,
    },
    {
      loyaltyCost: -6,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "create-token",
        token: "6/6 Wurm Token",
        count: { countOf: { type: "land", controlledBy: "you" } },
      },
      resolve: null,
      text: ULT_TEXT,
    },
  ],
});
