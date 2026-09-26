import { defineCard } from "../define.js";

// #78 in top-commanders.txt.
//
// "X mana of any one color" with a live X: all of it one colour, her power
// read as the ability is activated, or as the payer plans a payment with it.
// A creature spell's mana value counts its chosen {X} (rule 202.3e), and a
// creature spell with {X} in its mana cost may be paid for whatever X is.
const CAST_TEXT =
  "Whenever you cast a creature spell with mana value 4 or greater, you draw a card, gain 1 life, and put a " +
  "+1/+1 counter on Helga.";
const SPEND_TEXT =
  "Spend this mana only to cast creature spells with mana value 4 or greater or creature spells with {X} in " +
  "their mana costs.";
const MANA_TEXT = `{T}: Add X mana of any one color, where X is Helga's power. ${SPEND_TEXT}`;

export default defineCard({
  name: "Helga, Skittish Seer",
  manaCost: "{G}{W}{U}",
  colors: ["G", "W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Frog", "Druid"],
  power: 1,
  toughness: 3,
  text: `${CAST_TEXT}\n${MANA_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "cast-spell",
        who: "you",
        filter: { type: "creature", manaValue: { op: "gte", n: 4 } },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "gain-life", amount: 1 },
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
        ],
      },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: { powerOf: "source" },
        spendOnly: {
          spell: { type: "creature", anyOf: [{ manaValue: { op: "gte", n: 4 } }, { xInManaCost: true }] },
          text: SPEND_TEXT,
        },
      },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
