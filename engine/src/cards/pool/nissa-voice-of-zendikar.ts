import { defineCard } from "../define.js";

// EDHREC rank 5238.

const LANDS = { type: "land", controlledBy: "you" } as const;

export default defineCard({
  name: "Nissa, Voice of Zendikar",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Nissa"],
  loyalty: 3,
  text: "+1: Create a 0/1 green Plant creature token.\n−2: Put a +1/+1 counter on each creature you control.\n−7: You gain X life and draw X cards, where X is the number of lands you control.",
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Plant Token", count: 1 },
      resolve: null,
      text: "+1: Create a 0/1 green Plant creature token.",
    },
    {
      loyaltyCost: -2,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
      },
      resolve: null,
      text: "−2: Put a +1/+1 counter on each creature you control.",
    },
    {
      loyaltyCost: -7,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-life", amount: { countOf: LANDS } },
          { kind: "draw", amount: { countOf: LANDS } },
        ],
      },
      resolve: null,
      text: "−7: You gain X life and draw X cards, where X is the number of lands you control.",
    },
  ],
});
