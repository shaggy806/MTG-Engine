import { defineCard } from "../define.js";

// EDHREC rank 5866.
//
// Rulings:
//   [2022-10-07] Herald of Slaanesh's first ability only reduces the generic mana component of
//     costs. It cannot reduce the cost of colored mana components.

const REDUCE_TEXT = "Locus of Slaanesh — Demon spells you cast cost {2} less to cast.";
const HASTE_TEXT = "Other Demons you control have haste.";

export default defineCard({
  name: "Herald of Slaanesh",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 2,
  toughness: 2,
  text: `${REDUCE_TEXT}\n${HASTE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { subtype: "Demon" }, caster: "you", reduceGeneric: 2 },
      text: REDUCE_TEXT,
    },
    {
      affects: { scope: "filter", filter: { subtype: "Demon", controlledBy: "you" }, excludeSelf: true },
      grantKeywords: ["haste"],
      text: HASTE_TEXT,
    },
  ],
});
