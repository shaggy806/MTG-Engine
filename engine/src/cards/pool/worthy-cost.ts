import { defineCard } from "../define.js";

// EDHREC rank 5652.
//
// The sacrifice is a mandatory additional cost (rule 601.2f), paid as the
// spell is cast — so it stands even if the spell is countered.
export default defineCard({
  name: "Worthy Cost",
  manaCost: "{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "As an additional cost to cast this spell, sacrifice a creature.\nExile target creature or planeswalker.",
  additionalCost: { sacrifice: { type: "creature" } },
  targets: [{ kind: "permanent", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: { kind: "exile", target: 0 },
});
