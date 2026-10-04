import { defineCard } from "../define.js";

// EDHREC rank 2609.
//
// Rulings:
//   [2025-06-06] To determine the total cost of a spell, start with the mana cost or alternative
//     cost you're paying (such as a flashback cost), add any cost increases (such as kicker
//     costs), then apply any cost reductions (such as that of Cid's first ability). The mana value
//     of the spell is determined by only its mana cost, no matter what the total cost to cast that
//     spell was.
//   [2025-06-06] The cost reduction applies only to generic mana in the total cost of Equipment
//     and Vehicle spells you cast.

const REDUCE_TEXT = "Equipment and Vehicle spells you cast cost {1} less to cast.";
const JUMP_TEXT = "Jump — During your turn, Cid has flying.";
const RETURN_TEXT = "{2}, {T}: Return target Equipment or Vehicle card from your graveyard to your hand.";

export default defineCard({
  name: "Cid, Freeflier Pilot",
  manaCost: "{1}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warrior", "Pilot"],
  power: 2,
  toughness: 2,
  text: `${REDUCE_TEXT}\n${JUMP_TEXT}\n${RETURN_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      // `subtypes` is an OR: an Equipment or a Vehicle.
      costModification: { applies: { subtypes: ["Equipment", "Vehicle"] }, caster: "you", reduceGeneric: 1 },
      text: REDUCE_TEXT,
    },
    {
      affects: { scope: "self" },
      condition: { kind: "your-turn" },
      grantKeywords: ["flying"],
      text: JUMP_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { subtypes: ["Equipment", "Vehicle"] } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
