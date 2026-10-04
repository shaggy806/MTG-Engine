import { defineCard } from "../define.js";

// EDHREC rank 6309.
//
// `subtypes` is an OR, and one reduction covers a spell that's both (the third ruling).
// Reinforce is Channel's shape (rule 702.77a): a hand ability that discards the card as
// part of its cost (`zone: "hand"`).
//
// Rulings:
//   [2008-04-01] The effect reduces the total cost of the spell, regardless of whether you chose
//     to pay additional or alternative costs.
//   [2008-04-01] When you cast an Elemental spell by paying its evoke cost, this effect reduces
//     the cost to cast that spell by {1}.
//   [2008-04-01] A spell you cast that’s both creature types costs {1} less to cast, not {2} less.

const COST_TEXT = "Elemental spells and Warrior spells you cast cost {1} less to cast.";
const REINFORCE_TEXT =
  "Reinforce 1—{1}{R} ({1}{R}, Discard this card: Put a +1/+1 counter on target creature.)";

export default defineCard({
  name: "Brighthearth Banneret",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Warrior"],
  power: 1,
  toughness: 1,
  text: `${COST_TEXT}\n${REINFORCE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { subtypes: ["Elemental", "Warrior"] }, caster: "you", reduceGeneric: 1 },
      text: COST_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{R}", tap: false },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: REINFORCE_TEXT,
      zone: "hand",
    },
  ],
});
