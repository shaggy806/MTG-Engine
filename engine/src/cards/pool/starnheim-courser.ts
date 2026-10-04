import { defineCard } from "../define.js";

// EDHREC rank 2969.
// The reduction applies only to generic mana (the ruling).

const REDUCE_TEXT = "Artifact and enchantment spells you cast cost {1} less to cast.";

export default defineCard({
  name: "Starnheim Courser",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Pegasus"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${REDUCE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { typesAnyOf: ["artifact", "enchantment"] }, caster: "you", reduceGeneric: 1 },
      text: REDUCE_TEXT,
    },
  ],
});
