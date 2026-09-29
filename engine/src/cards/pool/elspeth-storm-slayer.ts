import { defineCard } from "../define.js";

const DOUBLE_TEXT =
  "If one or more tokens would be created under your control, twice that many of those tokens are created instead.";
const PLUS_TEXT = "+1: Create a 1/1 white Soldier creature token.";
const ZERO_TEXT =
  "0: Put a +1/+1 counter on each creature you control. Those creatures gain flying until your next turn.";
const MINUS_TEXT = "−3: Destroy target creature an opponent controls with mana value 3 or greater.";

// The +1 makes two Soldiers under her own replacement. The 0's "those
// creatures" are the ones that got a counter — every creature you control as
// it resolves — so a creature arriving later gets neither.
export default defineCard({
  name: "Elspeth, Storm Slayer",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Elspeth"],
  loyalty: 5,
  text: `${DOUBLE_TEXT}\n${PLUS_TEXT}\n${ZERO_TEXT}\n${MINUS_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "would-create-token", multiplier: 2 },
      text: DOUBLE_TEXT,
    },
  ],
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Soldier Token", count: 1 },
      resolve: null,
      text: PLUS_TEXT,
    },
    {
      loyaltyCost: 0,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "add-counter-all",
            filter: { type: "creature", controlledBy: "you" },
            counter: "+1/+1",
            amount: 1,
          },
          {
            kind: "grant-keyword-all",
            filter: { type: "creature", controlledBy: "you" },
            keyword: "flying",
            duration: "until-your-next-turn",
          },
        ],
      },
      resolve: null,
      text: ZERO_TEXT,
    },
    {
      loyaltyCost: -3,
      cost: { mana: null, tap: false },
      targets: [
        {
          kind: "permanent",
          whose: "opponent",
          filter: { type: "creature", manaValue: { op: "gte", n: 3 } },
        },
      ],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: MINUS_TEXT,
    },
  ],
});
