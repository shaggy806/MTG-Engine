import { defineCard } from "../define.js";

const SAC_TEXT =
  "Pay 1 life, Sacrifice another creature: Put a -1/-1 counter on up to one target creature and draw a card.";
const PROLIFERATE_TEXT =
  "{B}{B}, Discard a card: Proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)";

export default defineCard({
  name: "Yawgmoth, Thran Physician",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 2,
  toughness: 4,
  text: `Protection from Humans\n${SAC_TEXT}\n${PROLIFERATE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      protection: { filter: { subtype: "Human" } },
      text: "Protection from Humans",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, payLife: 1, sacrifice: "creature-you-control" },
      otherOnly: true,
      targets: [{ kind: "optional", of: "creature" }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "-1/-1", amount: 1 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: SAC_TEXT,
    },
    {
      cost: { mana: "{B}{B}", tap: false, discard: { count: 1 } },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: PROLIFERATE_TEXT,
    },
  ],
});
