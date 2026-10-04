import { defineCard } from "../define.js";

// EDHREC rank 5848.
//
// Rulings:
//   [2018-07-13] A "Dragon spell" refers only to a spell that has the Dragon subtype, regardless
//     of its name. For example, Dragon's Hoard isn't a Dragon spell.
//   [2018-07-13] Because it's a loyalty ability, Sarkhan's second ability isn't a mana ability. It
//     can be activated only any time you could cast a sorcery. It uses the stack and can be
//     responded to.
//
// The rummage is Restless Vents' "if you do" (the discard happening); the mana
// is Orb of Dragonkind's two-in-any-combination with a spend restriction —
// spells only, so no `abilityOf`.

const RUMMAGE_TEXT = "+1: You may discard a card. If you do, draw a card.";
const MANA_TEXT =
  "+1: Add two mana in any combination of colors. Spend this mana only to cast Dragon spells.";
const ULT_TEXT = "−7: Create four 5/5 red Dragon creature tokens with flying.";

export default defineCard({
  name: "Sarkhan, Fireblood",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Sarkhan"],
  loyalty: 3,
  text: `${RUMMAGE_TEXT}\n${MANA_TEXT}\n${ULT_TEXT}`,
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Discard a card to draw a card?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "discard", target: "you", amount: 1 },
            {
              kind: "conditional",
              condition: { kind: "this-way", what: "discarded" },
              then: { kind: "draw", amount: 1 },
            },
          ],
        },
      },
      resolve: null,
      text: RUMMAGE_TEXT,
    },
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: { oneOf: ["W", "U", "B", "R", "G"] },
        amount: 2,
        spendOnly: {
          spell: { subtype: "Dragon" },
          text: "Spend this mana only to cast Dragon spells.",
        },
      },
      resolve: null,
      text: MANA_TEXT,
    },
    {
      loyaltyCost: -7,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Dragon Token", count: 4 },
      resolve: null,
      text: ULT_TEXT,
    },
  ],
});
