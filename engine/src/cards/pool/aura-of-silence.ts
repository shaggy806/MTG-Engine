import { defineCard } from "../define.js";

const COST_TEXT = "Artifact and enchantment spells your opponents cast cost {2} more to cast.";
const SAC_TEXT = "Sacrifice this enchantment: Destroy target artifact or enchantment.";

export default defineCard({
  name: "Aura of Silence",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: `${COST_TEXT}\n${SAC_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { typesAnyOf: ["artifact", "enchantment"] }, caster: "opponent", increaseGeneric: 2 },
      text: COST_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: ["artifact-or-enchantment"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
