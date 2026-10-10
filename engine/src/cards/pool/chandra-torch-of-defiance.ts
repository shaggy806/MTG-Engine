import { defineCard } from "../define.js";

// EDHREC rank 1550. Both +1s are loyalty abilities, so neither is a mana
// ability (rule 605.1a): the {R}{R} uses the stack. The first +1's card is
// cast as it resolves, paying its costs (the rulings) — a land can't be, so
// it deals the 2 damage.
const EXILE = "+1: Exile the top card of your library. You may cast that card. If you don't, Chandra deals 2 damage to each opponent.";
const MANA = "+1: Add {R}{R}.";
const BOLT = "−3: Chandra deals 4 damage to target creature.";
const EMBLEM = "Whenever you cast a spell, this emblem deals 5 damage to any target.";
const ULTIMATE = `−7: You get an emblem with "${EMBLEM}"`;

export default defineCard({
  name: "Chandra, Torch of Defiance",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Chandra"],
  loyalty: 4,
  text: `${EXILE}\n${MANA}\n${BOLT}\n${ULTIMATE}`,
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "exile-from-library", amount: 1 },
          {
            kind: "cast-now",
            from: "exiled-this-way",
            else: { kind: "damage", amount: 2, who: "each-opponent" },
          },
        ],
      },
      resolve: null,
      text: EXILE,
    },
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 2 },
      resolve: null,
      text: MANA,
    },
    {
      loyaltyCost: -3,
      cost: { mana: null, tap: false },
      targets: ["creature"],
      effect: { kind: "damage", amount: 4, target: 0 },
      resolve: null,
      text: BOLT,
    },
    {
      loyaltyCost: -7,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "create-emblem",
        text: EMBLEM,
        triggered: [
          {
            trigger: { on: "cast-spell", who: "you" },
            targets: ["any-target"],
            effect: { kind: "damage", amount: 5, target: 0 },
            resolve: null,
            text: EMBLEM,
          },
        ],
      },
      resolve: null,
      text: ULTIMATE,
    },
  ],
});
