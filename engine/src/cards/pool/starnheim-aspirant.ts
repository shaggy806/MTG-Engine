import { defineCard } from "../define.js";

// EDHREC rank 3132.
//
// Rulings:
//   [2021-02-05] The cost reduction applies only to generic mana in the costs of Angel spells
//     you cast. It can't reduce requirements of specific colors of mana.
//   [2021-02-05] An Angel spell is a creature spell with the creature type Angel.

const COST_TEXT = "Angel spells you cast cost {2} less to cast.";

export default defineCard({
  name: "Starnheim Aspirant",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 2,
  toughness: 2,
  text: COST_TEXT,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { subtype: "Angel" }, caster: "you", reduceGeneric: 2 },
      text: COST_TEXT,
    },
  ],
});
