import { defineCard } from "../define.js";
import { regenerateSelfAbility } from "../helpers.js";

const COST_TEXT = "Blue spells and red spells you cast cost {1} less to cast.";

export default defineCard({
  name: "Nightscape Familiar",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 1,
  toughness: 1,
  text: `${COST_TEXT}\n{1}{B}: Regenerate this creature.`,
  static: [
    {
      affects: { scope: "self" },
      // A blue-red spell is one spell: {1} less, once.
      costModification: { applies: { anyOf: [{ colors: ["U"] }, { colors: ["R"] }] }, caster: "you", reduceGeneric: 1 },
      text: COST_TEXT,
    },
  ],
  activated: [regenerateSelfAbility("{1}{B}", "{1}{B}: Regenerate this creature.")],
});
